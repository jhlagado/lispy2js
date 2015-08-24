angular.module("lispy2App", [])

.controller('Main', function($scope) {
    $scope.lines = [];
    $scope.command = '(begin (define x 1) x)';
    
    $scope.go = function() {
        $scope.lines.push({
            command: $scope.command,
            result: lispy2.run($scope.command),
        });
        $scope.command = '';
    }

    $scope.setcommand = function(command){
        $scope.command = command;
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
