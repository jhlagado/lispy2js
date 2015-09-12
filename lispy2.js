'use strict';

(function(root, factory) {
    
    if (typeof exports === 'object' && exports) {
        factory(exports); // CommonJS
    } else {
        var lib = {};
        factory(lib);
        if (typeof define === 'function' && define.amd)
            define(lib); // AMD
        else
            root[lib.name] = lib; // <script>
    }

}(this, function(lib) {
    
    lib.name = 'lispy2';
    lib.version = '0.0.0';
    
    lib.setoutput = setoutput;
    lib.run = run;
    lib.parse = parse;
    lib.evaluate = evaluate;
    lib.tostring = tostring;
    lib.createSym = createSym;
    lib.issymbol = issymbol;
    lib.SyntaxError = SyntaxError;
    lib.RuntimeError = RuntimeError;
    
    var sym, globalEnv, quotes, EOF, macrotable;
    
    var output = console;

    initFunk();
    initSymbols();
    initGlobals();
    initMacros();

    //outputs are objects that support the js logging interface 
    //e.g. console
    //they must support the method log()
    function setoutput(aoutput) {
        output = aoutput;
    }
    
    function run(expression) {
        var s = expression; //.replace(/\n/g, ' '); //strip \n
        var p = parse(s);
        return evaluate(p)
    }
    
    function parse(s) {
        require(s, isstring(s));
        require(s, s.trim().length);
        return expand(read(tokzer(s)), true);
    }
    
    function tokzer(s) {
        var lines = s.split('\n');
        var line = '';
        return function() {
            while (true) {
                if (!line.length)
                    line = lines.shift();
                if (line == undefined)
                    return EOF;
                // see https://regex101.com/#javascript
                var regex = /\s*(,@|[('`,)]|'(?:[\\].|[^\\'])*'|;.*|[^\s(''`,;)]*)(.*)/g;
                var list = regex.exec(line);
                var token = list[1];
                line = list[2];
                if (token.length && !startswith(token, ';'))
                    return token;
            }
        }
    }
    
    function read(tokzer) {
        
        function readAhead(token) {
            if (token == '(') {
                var list = []
                while (true) {
                    token = tokzer();
                    if (token == ')')
                        return list;
                    else
                        list.push(readAhead(token));
                }
            } 
            else if (token == ')')
                throw new SyntaxError('unexpected )')
            else if (token in quotes)
                return [quotes[token], read(tokzer)]
            else if (token == EOF)
                throw new SyntaxError('unexpected EOF in list')
            else
                return atom(token)
        
        }
        var token1 = tokzer();
        return token1 == EOF ? EOF : readAhead(token1);
    }
    
    function atom(token) {
        if (token == '#t')
            return true
        else if (token == '#f')
            return false
        else if (token[0] == '"') {
            return token.slice(1, -1);
        } 
        else if (isNaN(token))
            return createSym(token);
        else
            return +token; //Cast to number
    }
    
    function initSymbols() {
        sym = {};
        
        EOF = createSym('EOF');
        
        ['quote', 'if', 'set!', 'define', 'lambda', 'begin', 'define-macro', 'quasiquote', 'unquote', 
            'unquote-splicing', 'append', 'cons', 'let'].forEach(function(s) {
            createSym(s);
        });
        
        quotes = {
            '\'': sym.quote,
            '`': sym.quasiquote,
            ',': sym.unquote,
            ',@': sym.unquotesplicing
        }
    }
    
    function initGlobals() {
        
        globalEnv = createEnv([], [], null);
        
        var basics = {
            
            '+': function(a, b) {
                return a + b;
            },
            '-': function(a, b) {
                return a - b;
            },
            '*': function(a, b) {
                return a * b;
            },
            '/': function(a, b) {
                return a / b;
            },
            'remainder': function(a, b) {
                return a % b;
            },
            'not': function(a) {
                return !a;
            },
            '>': function(a, b) {
                return a > b;
            },
            '<': function(a, b) {
                return a < b;
            },
            '>=': function(a, b) {
                return a >= b;
            },
            '<=': function(a, b) {
                return a <= b;
            },
            '=': function(a, b) {
                return a === b;
            },
            'equal?': function(a, b) {
                return a == b;
            },
            'eq?': function(a, b) {
                return a === b;
            },
            'length': function(a) {
                return a.length;
            },
            'cons': cons,
            'car': function(a) {
                return a[0];
            },
            'cdr': function(a) {
                return a.slice(1);
            },
            'append': function(a, b) {
                return a.concat(b);
            },
            'list': function() {
                return argarray(arguments);
            },
            'list?': function(x) {
                return isarray(x);
            },
            'null?': function(x) {
                return (!x || x.length === 0);
            },
            'symbol?': function(x) {
                return typeof x === 'string';
            },
            'boolean?': function(x) {
                return isboolean(x);
            },
            'pair?': ispair,
            'apply': function(proc, args) {
                return proc.apply(null, args);
            },
            'eval': function(x) {
                return evaluate(x, output);
            },
            'display': function(x) {
                output.log(isstring(x) ? x : tostring(x));
            },
            'call/cc': callcc,

            //added by jh
            'get': function(a, b) {
                return a[b];
            },
            'type': function(a) {
                return typeof a;
            },
        }
        
        var math = pick(Math, ['abs', 'acos', 'asin', 'atan', 'atan2', 
            'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 
            'random', 'round', 'sin', 'sqrt', 'tan']);
        
        return envAssign(globalEnv, assign({}, basics, math));
    }
    
    function initMacros() {
        macrotable = {};
        macrotable['let'] = _let;
        evaluate(parse(
        '(begin                                                   \n' + 
        '(define-macro and (lambda args                           \n' + 
        '   (if (null? args) #t                                   \n' + 
        '       (if (= (length args) 1) (car args)                \n' + 
        '           `(if ,(car args) (and ,@(cdr args)) #f)))))   \n' + 
        ')                                                        \n'
        ));
    }
    
    function evaluate(x, env) {
        
        if (!existy(x))
            return x;
        
        if (!env)
            env = globalEnv;
        
        while (true) {
            
            if (issymbol(x)) // v reference
                return envGet(env, x);
            else if (!isarray(x)) // constant literal
                return x
            else if (x[0] === sym.quote) // (quote exp)
                return x[1];
            else if (x[0] === sym.if) // (if test conseq alt)
                x = evaluate(x[1], env) ? x[2] : x[3];
            else if (x[0] === sym['set!']) { // (set! var exp)
                var v = x[1];
                envSet(env, v, evaluate(x[2], env));
                return;
            } 
            else if (x[0] === sym.define) { // (define var exp)
                var v = x[1];
                envDefine(env, v, evaluate(x[2], env));
                return;
            } 
            else if (x[0] === sym.lambda) { // (lambda (var*) exp)
                var vars = x[1];
                var exp = x[2];
                return function() {
                    return evaluate(exp, createEnv(vars, argarray(arguments), env));
                }
            } 
            else if (x[0] === sym.begin) { // (begin exp+)
                x.slice(1, -1).forEach(function(exp) {
                    evaluate(exp, env)
                });
                x = x.slice(-1)[0];
            } 
            else { // (proc exp*)
                var exps = map(x, function(exp) {
                    return evaluate(exp, env);
                });
                var proc = exps.shift();
                if (proc.apply) {
                    return proc.apply(env, exps);
                } 
                else {
                    throw new RuntimeError(proc + ' is not a function.')
                }
            }
        }
    }
    
    function expand(x, toplevel) {
        if (!existy(toplevel))
            toplevel = false;
        
        require(x, !isempty(x)) // () => Error
        if (!isarray(x)) { // constant => unchanged
            return x
        } 
        else if (x[0] === sym.quote) { // (quote exp)
            require(x, length(x) == 2)
            return x
        } 
        else if (x[0] === sym.if) {
            if (length(x) == 3) {
                x.length = 4
            } // (if t c) => (if t c None)
            require(x, length(x) == 4)
            return map(x, expand)
        } 
        else if (x[0] === sym['set!']) {
            require(x, length(x) == 3);
            require(x, issymbol(x[1]), 'can set! only a symbol');
            return [sym['set!'], x[1], expand(x[2])]
        } 
        else if (x[0] === sym.define || x[0] === sym['define-macro']) {
            require(x, length(x) >= 3)
            var def = x[0];
            var v = x[1];
            var body = x.slice(2);
            if (isarray(v) && v) { // (define (f args) body)
                var f = v[0];
                var args = v.slice(1); //  => (define f (lambda (args) body))
                return expand([def, f, [sym.lambda, args].concat(body)])
            } 
            else {
                require(x, length(x) == 3) // (define non-var/list exp) => Error
                require(x, issymbol(v), 'can define only a symbol')
                var exp = expand(x[2])
                if (def == sym['define-macro']) {
                    require(x, toplevel, 'define-macro only allowed at top level');
                    var proc = evaluate(exp);
                    require(x, isfunction(proc), 'macro must be a procedure');
                    macrotable[v] = proc; // (define-macro v proc)
                    return; //  => None; add v:proc to macro_table
                }
                return [sym.define, v, exp]
            }
        } 
        else if (x[0] === sym.begin) {
            if (length(x) == 1)
                return undefined; // (begin) => None
            else {
                return map(x, function(xi) {
                    return expand(xi, toplevel)
                });
            }
        } 
        else if (x[0] === sym.lambda) { // (lambda (x) e1 e2) 
            require(x, length(x) >= 3) //  => (lambda (x) (begin e1 e2))
            var vars = x[1];
            var body = x.slice(2);
            require(x, issymbol(vars) || all(map(vars, function(v) {
                return issymbol(v);
            })), 'illegal lambda argument list')
            var exp = length(body) == 1 ? body[0] : cons(sym.begin, body);
            return [sym.lambda, vars, expand(exp)]
        } 
        else if (x[0] === sym.quasiquote) { // `x => expand_quasiquote(x)
            require(x, length(x) == 2)
            return expand_quasiquote(x[1])
        } 
        else if (issymbol(x[0]) && (x[0] in macrotable)) {
            return expand(macrotable[x[0]].apply(null, x.slice(1)), toplevel) // (m arg...) 
        } 
        else { //        => macroexpand if m isa macro
            return map(x, expand) // (f arg...) => expand each
        }
    }
    
    function require(x, predicate, msg) {
        if (!existy(msg))
            msg = 'wrong length';
        if (!predicate)
            throw new SyntaxError(tostring(x) + ': ' + msg);
    }
    
    function expand_quasiquote(x) {
        // Expand `x => 'x; `,x => x; `(,@x y) => (append x y) """
        if (!ispair(x))
            return [sym.quote, x]
        
        require(x, x[0] !== sym.unquotesplicing, "can't splice here")
        if (x[0] == sym.unquote) {
            require(x, length(x) == 2);
            return x[1];
        } 
        else if (ispair(x[0]) && x[0][0] == sym.unquotesplicing) {
            require(x[0], length(x[0]) == 2)
            return [sym.append, x[0][1], expand_quasiquote(x.slice(1))]
        } 
        else
            return [sym.cons, expand_quasiquote(x[0]), expand_quasiquote(x.slice(1))]
    }
    
    function _let() {
        var args = argarray(arguments);
        var x = cons(sym.let, args);
        require(x, length(args) > 1);
        var bindings = args[0];
        var body = args.slice(1);
        require(x, all(map(bindings, function(b) {
            return isarray(b) && length(b) == 2 && issymbol(b[0]);
        }, "illegal binding list")));
        var uz = unzip(bindings);
        var vars = uz[0];
        var vals = uz[1];
        var f = [[sym.lambda, vars].concat(map(body, expand))].concat(map(vals, expand));
        return f;
    }
    
    function callcc(func) {
        var ball = new RuntimeWarning("Sorry, can't continue this continuation any longer.");
        try {
            return func(function raise(retval) {
                ball.retval = retval;
                throw ball;
            });
        } 
        catch (w) {
            if (w == ball)
                return ball.retval;
            else
                throw w;
        }
    }
    

    function createSym(s) {
        if (!(s in sym)) {
            var sy = new String(s);
            sy.type = 'symbol';
            sym[s] = sy;
        }
        return sym[s];
    }
    
    function issymbol(obj) {
        return obj && obj.constructor == String && obj.type == 'symbol';
    }
    
    function createEnv(params, args, outer) {
        var env = {
            __outer: outer,
        };
        if (issymbol(params))
            envDefine(env, params, args);
        else {
            if (length(args) != length(params)) {
                throw new SyntaxError('Expected ' + length(params) + 
                ' args, got ' + length(args) + ' args');
            }
            var dict = zipobject(map(params, function(symbol) {
                return symbol;
            }), args);
            envAssign(env, dict);
        }
        return env;
    }
    
    function findEnv(env, v) {
        if (v in env)
            return env;
        else if (env.__outer)
            return findEnv(env.__outer, v);
        throw new RuntimeError('Could not lookup ' + v);
    }
    
    function envGet(env, v) {
        return findEnv(env, v)[v];
    }
    
    function envDefine(env, v, value) {
        env[v] = value;
    }
    
    function envSet(env, v, value) {
        return findEnv(env, v)[v] = value;
    }
    
    function envAssign(env, dict) {
        assign(env, dict);
    }

    function SyntaxError(msg) {
        this.msg = 'SyntaxError: ' + msg;
        output.error(msg);
    }
    
    function RuntimeError(msg) {
        this.msg = 'RuntimeError: ' + msg;
        output.error(msg);
    }
    
    function RuntimeWarning(msg) {
        this.msg = 'RuntimeWarning: ' + msg;
        output.warn(msg);
    }
    
    function tostring(x) {
        if (x === true)
            return '#t'
        else if (x === false)
            return '#f'
        else if (isNaN(x)) {
            if (issymbol(x))
                return x;
            else if (isstring(x))
                return '"' + x + '"';
            else if (isarray(x))
                return '(' + map(x, tostring).join(' ') + ')'
            else
                return String(x)
        } 
        else {
            return x;
        }
    }
    
    var pick, zipobject, unzip, argarray, length, assign, map, reduce, isarray, 
    isempty, isobject, isstring, isboolean, isfunction, filter, all, ispair, 
    cons, isa, existy, startswith;
    
    function initFunk() {
        pick = funk.pick;
        zipobject = funk.zipobject;
        unzip = funk.unzip;
        argarray = funk.argarray;
        length = funk.length;
        assign = funk.assign;
        map = funk.map;
        reduce = funk.reduce;
        isarray = funk.isarray;
        isempty = funk.isempty;
        isobject = funk.isobject;
        isstring = funk.isstring;
        isboolean = funk.isboolean;
        isfunction = funk.isfunction;
        filter = funk.filter;
        all = funk.all;
        ispair = funk.ispair;
        cons = funk.cons;
        isa = funk.isa;
        existy = funk.existy;
        startswith = funk.startswith;
    
    }

}));
