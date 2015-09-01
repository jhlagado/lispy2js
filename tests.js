"use strict";

angular.module("lispy2Tests", [])

.factory('testdata', function() {
    return {
        tests: [

            //lispy1
            
            {test: "(1 2 3)",expect: expectRuntimeError}, 
            {test: "'(1 2 7)",expect: [1, 2, 7]}, 
            {test: "`(1 2 ,(+ 3 4))",expect: [1, 2, 7]}, 
            {test: "`(1 ,@(list 1 1 1) 1)",expect: [1, 1, 1, 1, 1]}, 
            
            {test: '(and #t #t)',expect: true}, 
            
            {test: '\
(define combine (lambda (f)\n\
    (lambda (x y) \n\
        (if (null? x) (quote ()) \n\
           (f (list (car x) (car y)) \n\
             ((combine f) (cdr x) (cdr y)))))))\
             ',expect: undefined}, 
            
            {test: '(define zip (combine cons))',expect: undefined}, 
            {test: '(zip (list 1 2 3 4) (list 5 6 7 8))',expect: [[1, 5], [2, 6], [3, 7], [4, 8]]}, 
            
            
            {test: '(quote (testing 1 (2.0) -3.14e159))',expect: [lispy2.createSym('testing'), 1, [2.0], -3.14e159]}, 
            {test: '(+ 2 2)',expect: 4}, 
            {test: '(+ (* 2 100) (* 1 10))',expect: 210}, 
            {test: '(if (> 6 5) (+ 1 1) (+ 2 2))',expect: 2}, 
            {test: '(if (< 6 5) (+ 1 1) (+ 2 2))',expect: 4}, 
            {test: '(define x 3)',expect: undefined}, 
            {test: 'x',expect: 3}, 
            {test: '(+ x x)',expect: 6}, 
            {test: '(begin (define x 1) (set! x (+ x 1)) (+ x 1))',expect: 3}, 
            {test: '((lambda (x) (+ x x)) 5)',expect: 10}, 
            {test: '(define twice (lambda (x) (* 2 x)))',expect: undefined}, 
            {test: '(twice 5)',expect: 10}, 
            {test: '(define compose (lambda (f g) (lambda (x) (f (g x)))))',expect: undefined}, 
            {test: '((compose list twice) 5)',expect: [10]}, 
            {test: '(define repeat (lambda (f) (compose f f)))',expect: undefined}, 
            {test: '((repeat twice) 5)',expect: 20}, 
            {test: '((repeat (repeat twice)) 5)',expect: 80}, 
            {test: '(define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))',expect: undefined}, 
            {test: '(fact 3)',expect: 6}, 
            {test: '(fact 50)',expect: 30414093201713378043612608166064768844377641568960512000000000000}, 
            {test: '(define abs (lambda (n) ((if (> n 0) + -) 0 n)))',expect: undefined}, 
            {test: '(list (abs -3) (abs 0) (abs 3))',expect: [3, 0, 3]}, 
            
            {test: '(define take (lambda (n seq) (if (<= n 0) (quote ()) \n (cons (car seq) (take (- n 1) (cdr seq))))))',expect: undefined}, 
            {test: '(take 2 (list 1 2 3))',expect: [1, 2]}, 
            {test: '(define drop (lambda (n seq) (if (<= n 0) seq (drop (- n 1) (cdr seq)))))',expect: undefined}, 
            {test: '(drop 1 (list 1 2 3))',expect: [2, 3]}, 
            {test: '(define mid (lambda (seq) (/ (length seq) 2)))',expect: undefined}, 
            {test: '(mid (list 1 2 3 4))',expect: 2}, 
            
            {test: '(define riff-shuffle (lambda (deck) \n' + 
                '(begin ((combine append) (take (mid deck) deck) (drop (mid deck) deck)))))',expect: undefined}, 
            
            {test: '(riff-shuffle (list 1 2 3 4 5 6 7 8))',expect: [1, 5, 2, 6, 3, 7, 4, 8]}, 
            {test: '((repeat riff-shuffle) (list 1 2 3 4 5 6 7 8))',expect: [1, 3, 5, 7, 2, 4, 6, 8]}, 
            {test: '(riff-shuffle (riff-shuffle (riff-shuffle (list 1 2 3 4 5 6 7 8))))',expect: [1, 2, 3, 4, 5, 6, 7, 8]}, 

            //lispy2

            {test: '()',expect:expectSyntaxError}, 
            {test: '(set! x)',expect:expectSyntaxError}, 
            {test: '(define 3 4)',expect:expectSyntaxError}, 
            {test: '(quote 1 2)',expect:expectSyntaxError}, 
            {test: '(if 1 2 3 4)',expect:expectSyntaxError}, 
            {test: '(lambda 3 3)',expect:expectSyntaxError}, 
            {test: '(lambda (x))',expect:expectSyntaxError}, 
            {test: '(if (= 1 2) (define-macro a \'a) (define-macro a \'b))',expect:expectSyntaxError}, 
            {test: '(define (twice x) (* 2 x))', expect:undefined}, 
            {test: '(twice 2)', expect:4},
            {test: '(twice 2 2)', expect:expectSyntaxError},
            {test: '(define lyst (lambda items items))', undefined},
            {test: '(lyst 1 2 3 (+ 2 2))', expect:[1,2,3,4]},
            {test: '(if 1 2)', expect:2},
            {test: '(if (= 3 4) 2)', expect:undefined},
            {test: '(define ((account bal) amt) (set! bal (+ bal amt)) bal)', expect:undefined},
            {test: '(define a1 (account 100))', expect:undefined},
            {test: '(a1 0)', expect:100}, 
            {test:'(a1 10)', expect:110}, 
            {test:'(a1 10)', expect:120},
            {test:
            '(define (newton guess function derivative epsilon)\n' +
                '(define guess2 (- guess (/ (function guess) (derivative guess))))\n'+
                '(if (< (abs (- guess guess2)) epsilon) guess2 \n'+
                '    (newton guess2 function derivative epsilon)))', expect:undefined},
            {test:
            '(define (square-root a)\n' +
                 '(newton 1 (lambda (x) (- (* x x) a)) (lambda (x) (* 2 x)) 1e-8))', 
                 expect:undefined},
            {test: '(> (square-root 200.) 14.14213)', expect:true},
            {test: '(< (square-root 200.) 14.14215)', expect:true},
            {test: '(= (square-root 200.) (sqrt 200.))', expect:true},
            {test:
            '(define (sum-squares-range start end)\n' +
            '     (define (sumsq-acc start end acc)\n' +
            '        (if (> start end) acc (sumsq-acc (+ start 1) end (+ (* start start) acc))))\n' +
            '     (sumsq-acc start end 0))', expect:undefined},
            {test: '(sum-squares-range 1 3000)', expect:9004500500}, // Tests tail recursion
            {test: '(call/cc (lambda (throw) (+ 5 (* 10 (throw 1))))) ;; throw', expect:1},
            {test: '(call/cc (lambda (throw) (+ 5 (* 10 1)))) ;; do not throw', expect:15},
            {test:'(call/cc (lambda (throw) \n' + 
                      '(+ 5 (* 10 (call/cc (lambda (escape) (* 100 (escape 3)))))))) ; 1 level', expect:35},
            {test:'(call/cc (lambda (throw)  \n' + 
                      '(+ 5 (* 10 (call/cc (lambda (escape) (* 100 (throw 3)))))))) ; 2 levels', expect:3},
            {test:'(call/cc (lambda (throw)  \n' + 
            '(+ 5 (* 10 (call/cc (lambda (escape) (* 100 1))))))) ; 0 levels', expect:1005},

//             {test: '(* 1i 1i)", -1), ("(sqrt -1)', 1j), //no support for complex numbers

            {test: '(let ((a 1) (b 2)) (+ a b))', expect:3},
            {test: '(let ((a 1) (b 2 3)) (+ a b))', expect:expectSyntaxError},
            {test: '(and 1 2 3)", 3), ("(and (> 2 1) 2 3)', expect:3}, 
            {test:'(and)', expect:true},
            {test: '(and (> 2 1) (> 2 3))', expect:false},
            {test: '(define-macro unless (lambda args `(if (not ,(car args)) (begin ,@(cdr args))))) ; test `', expect:undefined},
            {test: '(unless (= 2 (+ 1 1)) (display 2) 3 4)', expect:undefined},
            {test: '(unless (= 4 (+ 1 1)) (display 2) (display "\\n") 3 4)', expect:4},
            {test: '(quote x)', expect:expectSymbol('x')}, 
            {test: '(quote (1 2 three))', expect:[1, 2, lispy2.createSym('three')]}, 
            {test: '\'x', expect:lispy2.createSym('x')},
            {test: '\'(one 2 3)', expect:[lispy2.createSym('one'), 2, 3]},
            {test: '(define L (list 1 2 3))', expect:undefined},
            {test: '`(testing ,@L testing)', expect:[lispy2.createSym('testing'),1,2,3,lispy2.createSym('testing')]},
            {test: '`(testing ,L testing)', expect:[lispy2.createSym('testing'),[1,2,3],lispy2.createSym('testing')]},
            {test: '`,@L', expect:expectSyntaxError},
            
            {test: '\'(1 ;test comments \'          \n' +
            ';skip this line             \n' +
            '2 ; more ; comments ; ) )   \n' +
            '3) ; final comment          \n',
            expect:[1,2,3]},

//misc
            {name: 'number',test: '1',expect: 1}, 
            {name: 'bool true',test: '#t',expect: true}, 
            {name: 'bool false',test: '#f',expect: false}, 
            {name: 'string',test: '"x"',expect: 'x'}, 
            {name: 'list',test: '(list 1 2 3)',expect: [1, 2, 3]}, 
            {name: 'define var',test: '(begin (define x 1) x)',expect: 1}, 
            {
                name: 'define var string',
                test: '(begin (define x "hello") x)',
                expect: "hello"
            }, 
            {
                name: 'type',
                test: '(type "")',
                expect: "string"
            }, 
            {
                name: 'get',
                test: '(type (get "" "constructor"))',
                expect: "function"
            }, 
            {
                name: 'lambda',
                test: '(type (lambda (x) (x)))',
                expect: "function"
            }, 
            {
                name: 'lambda run',
                test: '((lambda (x) x) 1)',
                expect: 1,
            }, 
            {
                name: 'let macro',
                test: '(let((x 1)(y 2)) (+ x y))',
                expect: 3,
            }, 
            {
                name: 'set!',
                test: '(begin (define x "hi") (set! x "bye") x)',
                expect: "bye"
            }, 
        ]
    }
    
    function expectSymbol(x){
        return function(data, result, error){
            return result && result.constructor == lispy2.Symbol && 
            result.toString() == x;
        }
    }

    function expectSyntaxError(data, result, error) {
        return error && error.constructor == lispy2.SyntaxError;
    }
    
    function expectRuntimeError(data, result, error) {
        return error && error.constructor == lispy2.RuntimeError;
    }
})

.controller('Tests', function($scope, testdata) {
    
    var output = new function Output(){
        this.lines = [];
        this.log = function(msg){
            this.lines.push(msg);
        }
        this.warn = this.log;
        this.error = this.log;
    }

    lispy2.setoutput(output);

    $scope.results = testdata.tests.map(function(data) {

        output.lines = [];

        var result, error;
        try {
            result = lispy2.run(data.test);
        } 
        catch (e) {
            error = e;
        } 
        
        var line = {
            name: data.name,
            test: data.test,
            result: error ? error.msg : lispy2.tostring(result),
            output: output.lines,
        }
        if (_.isFunction(data.expect)) {
            line.passed = data.expect(data, result, error);
        } 
        else {
            line.passed = _.isEqual(data.expect, result);
            line.expect = lispy2.tostring(data.expect);
        }
        return line;
    });
    
    $scope.fails = $scope.results.reduce(function(acc, item) {
        if (!item.passed)
            acc++;
        return acc;
    }, 0);

})

