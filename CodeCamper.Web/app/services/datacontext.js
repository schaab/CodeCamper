(function () {
    'use strict';

    var serviceId = 'datacontext';
    angular.module('app').factory(serviceId, ['common', 'entityManagerFactory', datacontext]);

    function datacontext(common, emFactory) {
        var EntityQuery = breeze.EntityQuery;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(serviceId);
        var logError = getLogFn(serviceId, 'error');
        var logSuccess = getLogFn(serviceId, 'success');
        var manager = emFactory.newManager();
        var primePromise;
        var $q = common.$q;

        var entityNames = {
            attendee: 'Person',
            person: 'Person',
            speaker: 'Person',
            session: 'Session',
            room: 'Room',
            track: 'Track',
            timeslot: 'TimeSlot'
        };

        var service = {
            getPeople: getPeople,
            getMessageCount: getMessageCount,
            getSessionPartials: getSessionPartials,
            getSpeakerPartials: getSpeakerPartials,
            prime: prime
        };

        return service;

        function getMessageCount() { return $q.when(72); }

        function getPeople() {
            var people = [
                { firstName: 'John', lastName: 'Papa', age: 25, location: 'Florida' },
                { firstName: 'Ward', lastName: 'Bell', age: 31, location: 'California' },
                { firstName: 'Colleen', lastName: 'Jones', age: 21, location: 'New York' },
                { firstName: 'Madelyn', lastName: 'Green', age: 18, location: 'North Dakota' },
                { firstName: 'Ella', lastName: 'Jobs', age: 18, location: 'South Dakota' },
                { firstName: 'Landon', lastName: 'Gates', age: 11, location: 'South Carolina' },
                { firstName: 'Haley', lastName: 'Guthrie', age: 35, location: 'Wyoming' }
            ];
            return $q.when(people);
        }

        function getSpeakerPartials() {
            var orderBy = 'firstName, lastName';
            var speakers = [];

            return EntityQuery.from('Speakers')
                                .select('id, firstName, lastName, imageSource')
                                .orderBy(orderBy)
                                .toType('Person')
                                .using(manager)
                                .execute()
                                .then(querySucceeded, _queryFailed);

            function querySucceeded(data) {
                speakers = data.results;
                log('Retrieved [Speaker Partials] from remote data source', speakers.length);
                return speakers;
            }
        }

        function getSessionPartials() {
            var orderBy = 'timeSlotId, level, speaker.firstName';
            var sessions;

            return EntityQuery.from('Sessions')
                              .select('id, title, code, speakerId, trackId, timeSlotId, roomId, level, tags')
                              .orderBy(orderBy)
                              .toType('Session')
                              .using(manager)
                              .execute()
                              .then(querySucceeded, _queryFailed);

            function querySucceeded(data) {
                sessions = data.results;
                log('Retrieved [Session Partials] from remote data source', sessions.length);
                return sessions;
            }
        }

        function prime() {
            if (primePromise) return primePromise;

            primePromise = $q.all([getLookups(), getSpeakerPartials()])
                .then(extendMetadata)
                .then(success);

            return primePromise;

            function success() {
                setLookups();
                log('Primed the data');
            }

            function extendMetadata() {
                var metadataStore = manager.metadataStore;
                var types = metadataStore.getEntityTypes();

                types.forEach(function (type) {
                    if (type instanceof breeze.EntityType) {
                        set(type.shortName, type);
                    }
                });

                var personEntityName = entityNames.person;
                ['Speakers', 'Speaker', 'Attendees', 'Attendee'].forEach(function (r) {
                    set(r, personEntityName)
                });

                function set(resourceName, entityName) {
                    metadataStore.setEntityTypeForResourceName(resourceName, entityName);
                }
            }
        }

        function setLookups() {
            service.lookupCachedData = {
                rooms: _getAllLocalData(entityNames.room, 'name'),
                tracks: _getAllLocalData(entityNames.track, 'name'),
                timeslots: _getAllLocalData(entityNames.timeslot, 'start')
            };
        }


        function _getAllLocalData(resource, ordering) {
            return EntityQuery.from(resource)
                                .orderBy(ordering)
                                .using(manager)
                                .executeLocally();
        }

        function getLookups() {
            return EntityQuery.from('Lookups')
                                .using(manager)
                                .execute()
                                .then(querySucceeded, _queryFailed);

            function querySucceeded(data) {                
                log('Retrieved [Lookups]', data, true);
                return true;
            }
        }
        

        function _queryFailed(error) {
            var msg = config.appErrorPrefix + 'Error retrieving data: ' + error.message;
            logError(msg, error);

            throw error;
        }
    }
})();