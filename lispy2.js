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
    
    lib.run = run;
    lib.parse = parse;
    lib.evaluate = evaluate;
    lib.tostring = tostring;
    
    var sym, globalEnv, quotes;
    var macrotable = {let: _let};
    
    initSymbols();
    initGlobals();
    initMacros();
    
    function initMacros() {
        macrotable['let'] = _let;
//         evaluate(parse('                                 \
// (begin                                                   \
// (define-macro and (lambda args                                             \
//    (if (null? args) #t                                   \
//        (if (= (length args) 1) (car args)                \
//            `(if ,(car args) (and ,@(cdr args)) #f)))))   \
// )                                                        \
// '));
    
    }
    
    function run(expression) {
        return evaluate(parse(expression))
    }
    
    function Symbol(str) {
        this.str = str;
    }
    
    function createSym(s) {
        if (!(s in sym))
            sym[s] = new Symbol(s);
        return sym[s];
    }
    
    function symvalue(symbol) {
        return symbol.str;
    }
    
    function parse(s) {
        require(s, isstring(s));
        require(s, s.trim().length);
        return expand(read(tokzer(s)), true);
    }
    
    function tokzer(s) {
        return function() {
            if (!s.length)
                return undefined;
            var regex = /\s*(,@|[('`,)]|'(?:[\\].|[^\\'])*'|;.*|[^\s(''`,;)]*)(.*)/g;
            var list = regex.exec(s);
            s = list[2];
            return list[1];
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
                throw ('unexpected )')
            else if (token in quotes)
                return [quotes[token], read(tokzer)]
            else if (token == undefined)
                throw ('unexpected EOF in list')
            else
                return atom(token)
        
        }
        var token1 = tokzer()
        return token1 != undefined ? readAhead(token1) : undefined;
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
    
    function createEnv(params, args, outer) {
        var env = {
            __outer: outer,
        };
        if (issymbol(params))
            env[params.str] = args;
        else
            assign(env, zipobject(map(params, symvalue), args));
        return env;
    }
    
    function findEnv(env, v) {
        if (v.str in env)
            return env;
        else if (env.__outer)
            return findEnv(env.__outer, v);
        throw 'look up error: ' + v.str;
    }
    
    function initSymbols() {
        sym = [];
        
        ['quote', 'if', 'set!', 'define', 'lambda', 'begin', 'define-macro', 'quasiquote', 'unquote', 
            'unquote-splicing', 'append cons', 'let'].forEach(function(s) {
            createSym(s);
        });
        
        quotes = {
            '"': sym.quote,
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
                return evaluate(x);
            },
            //added from clojure
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
        
        return assign(globalEnv, basics, math);
    }
    
    function evaluate(x, env) {
        
        if (!existy(x))
            x = '';
        
        if (!env)
            env = globalEnv;
        
        while (true) {
            
            if (issymbol(x)) // v reference
                return findEnv(env, x)[x.str]
            else if (!isarray(x)) // constant literal
                return x
            else if (x[0] === sym.quote) // (quote exp)
                return x[1];
            else if (x[0] === sym.if) // (if test conseq alt)
                x = eval(x[1], env) ? x[2] : x[3];
            else if (x[0] === sym['set!']) { // (set! var exp)
                var v = x[1];
                findEnv(env, v)[v.str] = evaluate(x[2], env);
                return;
            } 
            else if (x[0] === sym.define) { // (define var exp)
                var v = x[1];
                env[v.str] = evaluate(x[2], env);
                return;
            } 
            else if (x[0] === sym.lambda) { // (lambda (var*) exp)
                var vars = x[1];
                var exp = x[2];
                return function() {
                    return evaluate(exp, createEnv(vars, arguments, env));
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
                    throw 'ERROR: ' + proc + ' is not a function.'
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
                    var proc = eval(exp);
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
        else if (issymbol(x[0]) && (x[0].str in macrotable)) {
            return expand(macrotable[x[0].str].apply(null, x.slice(1)), toplevel) // (m arg...) 
        } 
        else { //        => macroexpand if m isa macro
            return map(x, expand) // (f arg...) => expand each
        }
    }
    
    function require(x, predicate, msg) {
        if (!existy(msg))
            msg = 'wrong length';
        if (!predicate)
            throw 'Syntax Error: ' + tostring(x) + ': ' + msg
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
        //[[_lambda, list(vars)]+map(expand, body)] + map(expand, vals)
        var f = [[sym.lambda, vars].concat(map(body, expand))].concat(map(vals, expand));
        return f;
    }
    
    function pick(object, keys) {
        var result = reduce(keys, function(acc, key) {
            acc[key] = object[key];
            return acc;
        }, {});
        return result;
    }
    
    function zipobject(props, values) {
        var index = -1, 
        length = props ? props.length : 0, 
        result = {};
        
        if (length && !values && !isarray(props[0])) {
            values = [];
        }
        while (++index < length) {
            var key = props[index];
            if (values) {
                result[key] = values[index];
            } else if (key) {
                result[key[0]] = key[1];
            }
        }
        return result;
    }
    
    function unzip(array) {
        if (!(array && array.length)) {
            return [];
        }
        var length = 0;
        array = filter(array, function(group) {
            if (isarray(group)) {
                length = Math.max(group.length, length);
                return true;
            }
        });
        var result = Array(length);
        var index = -1;
        while (++index < length) {
            result[index] = map(array, function(item) {
                return item[index]
            });
        }
        return result;
    }
    
    
    function argarray(args) {
        return Array.prototype.slice.call(args);
    }
    
    function length(x) {
        if (existy(x) && x.length)
            return x.length;
    }
    
    function assign() {
        if (!arguments.length)
            return;
        var args = argarray(arguments);
        var obj = reduce(args.slice(1), function(acc, arg) {
            for (var key in arg) {
                if (arg.hasOwnProperty(key)) {
                    acc[key] = arg[key];
                }
            }
            return acc;
        }, args[0])
        return obj;
    }
    
    function map(x, f) {
        if (x && x.map) {
            return x.map(f);
        }
    }
    
    function reduce(x, f, acc) {
        if (x && x.reduce) {
            return x.reduce(f, acc);
        }
    }
    
    function isarray(x) {
        return Array.isArray(x)
    }
    
    function isempty(x) {
        return isarray(x) && !x.length
    }
    
    function isobject(x) {
        return !isarray(x) && x === Object(x);
    }
    
    function isstring(x) {
        return (typeof x === 'string' || x instanceof String);
    }
    
    function isboolean(x) {
        return x === true || x === false;
    }
    
    function isfunction(x) {
        return typeof value == 'function' || false;
    }
    
    function issymbol(obj) {
        return obj && obj.constructor == Symbol;
    }
    
    function filter(array, func) {
        return array.reduce(function(acc, item) {
            if (func(item))
                acc.push(item);
            return acc;
        }, [])
    }
    
    function all(x, f) {
        if (!existy(f))
            f = function(item) {
                return item
            }
        if (existy(x) && x.every) {
            return x.every(f);
        }
    }
    
    function ispair(x) {
        return isarray(x) && x.length == 2;
    }
    
    function cons(x, y) {
        if (existy(x))
            return [x].concat(y);
    }
    
    function isa(x, constructor) {
        return existy(x) && x.constructor == constructor;
    }
    
    function existy(x) {
        return x != null;
    }
    
    function tostring(x) {
        if (isNaN(x)) {
            if (x == true)
                return '#t'
            else if (x == false)
                return '#f'
            else if (issymbol(x))
                return x.str;
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

}));
