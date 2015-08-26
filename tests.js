angular.module("lispy2Tests", [])

.factory('testdata', function() {
    return {
        tests: [

            {test: '\
(define combine (lambda (f)\
    (lambda (x y) \
        (if (undefined? x) (quote ()) \
           (f (list (car x) (car y)) \
             ((combine f) (cdr x) (cdr y)))))))\
             ', expect:undefined},

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
})

.controller('Tests', function($scope, testdata) {
    
    $scope.results = testdata.tests.map(function(data) {
        var result;
        try {
            result = lispy2.run(data.test);
        } 
        catch (e) {
            result = 'exception: ' + e;
        }
        return {
            name: data.name,
            test: data.test,
            
            passed: _.isFunction(data.expect) ? 
            data.expect(result) : _.isEqual(data.expect, result),

            result: lispy2.tostring(result),
            expect: lispy2.tostring(data.expect),
        }
    });
    
    $scope.fails = $scope.results.reduce(function(acc, item) {
        if (!item.passed)
            acc++;
        return acc;
    }, 0);

})

//     ("""(define combine (lambda (f)
//     (lambda (x y)
//       (if (undefined? x) (quote ())
//           (f (list (car x) (car y))
//              ((combine f) (cdr x) (cdr y)))))))""", undefined),
//     ("""(define riff-shuffle (lambda (deck) (begin
//     (define take (lambda (n seq) (if (<= n 0) (quote ()) (cons (car seq) (take (- n 1) (cdr seq))))))
//     (define drop (lambda (n seq) (if (<= n 0) seq (drop (- n 1) (cdr seq)))))
//     (define mid (lambda (seq) (/ (length seq) 2)))
//     ((combine append) (take (mid deck) deck) (drop (mid deck) deck)))))""", undefined),
//     ("(riff-shuffle (list 1 2 3 4 5 6 7 8))", [1, 5, 2, 6, 3, 7, 4, 8]),
//     ("((repeat riff-shuffle) (list 1 2 3 4 5 6 7 8))",  [1, 3, 5, 7, 2, 4, 6, 8]),
//     ("(riff-shuffle (riff-shuffle (riff-shuffle (list 1 2 3 4 5 6 7 8))))", [1,2,3,4,5,6,7,8]),
