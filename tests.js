angular.module("lispy2Tests", [])

.factory('testdata', function() {
    return {
        tests: [
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
            passed: _.isEqual(data.expect, result),
            result: result,
            expect: data.expect,
        }
    });
    
    $scope.fails = $scope.results.reduce(function(acc, item) {
        if (!item.passed)
            acc++;
        return acc;
    }, 0);

})

