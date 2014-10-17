(function () {
    'use strict';
    var controllerId = 'sessions';
    angular.module('app').controller(controllerId, ['common', 'datacontext', sessions]);

    function sessions(common, datacontext) {
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
            return datacontext.getSessionPartials().then(function (data) {
                return vm.sessions = data;
            });
        }
    }
})();