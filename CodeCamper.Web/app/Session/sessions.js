(function () {
    'use strict';
    var controllerId = 'sessions';
    angular.module('app').controller(controllerId, ['common', sessions]);

    function dashboard(common, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        var vm = this;
        
        vm.activate = activate;
        vm.sessions = [];
        vm.title = 'Sessions';
        

        activate();
        function activate() {
            
            common.activateController([getSessions], controllerId)
                .then(function () { log('Activated Sessions View'); });
        }

        function getSessions() {
           
        }
    }
})();