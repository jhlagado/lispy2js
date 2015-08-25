angular.module("lispy2App", [])

.controller('Main', function($scope) {
     $scope.lines = JSON.parse(localStorage['lines']) || [];
//      $scope.lines = [];
//    $scope.command = '(lambda (a) a)';
//    $scope.command = '';
    
    $scope.go = function() {
        try {
            var result = lispy2.run($scope.command);
        } 
        catch (e) {
            var error = 'exception: ' + e;
        }

        $scope.lines.push({
            command: $scope.command,
            result: lispy2.tostring(result),
            error: error,
        });
        if ($scope.lines.length > 5)
            $scope.lines.unshift();
        $scope.command = '';
        store();        
    }
    
    $scope.clear = function(){
        $scope.lines.length = 0;
        store();        
    }

    $scope.setcommand = function(command) {
        $scope.command = command;
    }

    function store(){
        localStorage['lines'] = JSON.stringify($scope.lines);
    }
})

.directive('scrolltobottom', function() {
    return {
        link: function(scope, element) {
            scope.$watch(function() {
                var cs = element.children();
                return cs.length ? cs[0].scrollHeight : undefined;
            }, function(h) {
                element[0].scrollTop = h;
            })
        }
    }
})
