var mainApplicationModuleName= 'cityhack';
var mainApp= angular.module(mainApplicationModuleName, ['ui.bootstrap', 'ngMaterial', 'ngMessages', 'chart.js']);

//a parametized get event
//Factory function to get latitude, longitude using address
mainApp.factory('getRecordings', ['$http',  function($http){
    return $http.get("/listRecordings");  
}]);




mainApp.controller('mainController',['$scope','$timeout', 'getRecordings','$mdToast' , "$mdDialog",function($scope, $timeout, getRecordings,$mdToast, $mdDialog){

  
    var self=this;
    $scope.recordings=[];
    $scope.currentRecording=0;
    $scope.currentPhrases=[];
    $scope.currentScores=[];

    getRecordings.success(function(data){
        console.log("successfully retrieved recordings", data);
        $scope.recordings=data;
        //$scope.$apply();
    }).error(function(error,status){
        console.log(error);
        
    });

    $scope.positivity=function(i){
        if($scope.currentScores[i]<0.5){
            return "#ff0000";
        }else{
            return "#222222";
        }
    }

    $scope.$watch('[convoId]', function(newValues, oldValues, $scope) {
        var uuid=newValues[0];
        $scope.currentRecording=0;
        $scope.currentPhrases=[];
        $scope.currentScores=[];
        for(var i=0; i< $scope.recordings.length; i++){
            if($scope.recordings[i].uuid==uuid){
                $scope.currentRecording=$scope.recordings[i];
                for(var u=0; u< $scope.currentRecording.key_phrases.length; u++){
                    for(var j=0; j<$scope.currentRecording.key_phrases[u].keyPhrases.length; j++){
                        $scope.currentPhrases.push($scope.currentRecording.key_phrases[u].keyPhrases[j]);
                    }
                }
                for(var u=0; u< $scope.currentRecording.emotions.length; u++){
                    $scope.currentScores.push($scope.currentRecording.emotions[u].score);
                }


                $scope.labels = [];
                for(var s=0; s<$scope.currentScores.length;s++){
                    $scope.labels.push(String(s));
                }
                $scope.series = ['Emotions'];
                $scope.data = $scope.currentScores;
                $scope.onClick = function (points, evt) {
                  console.log(points, evt);
                };
                $scope.chartcolors=["#B055D2"];
                $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
                $scope.options = {
                  scales: {
                    yAxes: [
                      {
                        id: 'y-axis-1',
                        type: 'linear',
                        display: true,
                        position: 'left'
                      },
                      {
                        id: 'y-axis-2',
                        type: 'linear',
                        display: true,
                        position: 'right'
                      }
                    ]
                  }
                };

            }
        }

    });



}]);