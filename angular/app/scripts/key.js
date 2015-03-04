'use strict';

angular
  .module('app')
  .controller('KeyController', function($scope, $timeout, OPEN_KNESSET,
                  $routeParams, $location, $window, $q, $log) {
    var db,
        myChairs = [],
        diff = [],
        key = {chairs: {}, abs: "", rel: ""};

    $scope.firstButton = function () {
      $location.path('/home')
    };

    $scope.adopt = function (chair) {
      var i = diff.indexOf(chair);
      $window.sessionStorage.setItem(toKey(i.id), chair.suggestedId);
      diff.splice(i, 1);
    }

    function drawKey () {
        var canvas = $window.document.getElementById('key-canvas');
        canvas.width = 560;
        canvas.height = 427;
        var ctx = canvas.getContext('2d');
        var back= new Image();
        back.src = "/images/key.png";
        back.onload = function() {
             ctx.drawImage(back,0,0);
             $scope.keyImage = ctx.canvas.toDataURL();
        }

        // Make sure the image is loaded first otherwise nothing will draw.
        var step = 1;
        for (var i=0; i < db.committees.length; i++) {
            var c = db.committees[i],
                chosen = key.chairs[c.id] || { name: 'כיסא ריק' };

            ctx.save();
            ctx.translate(canvas.width - step*30, 116);
            ctx.rotate((Math.PI/2)*3);
            ctx.font = "16pt Alef";
            ctx.textAlign = "right";
            var m = ctx.measureText(chosen.name)
            ctx.fillStyle = '#FCC221';
            ctx.fillRect(10, 5, 0-m.width-20, -28);
            // ctx.fillStyle = '#FCD421';

            ctx.fillStyle = '#80470E';
            ctx.fillText(chosen.name, 0, -2)
            ctx.restore();
            step++;
          }
    };
    function toKey(i) { return 'chair'+i };
    function fillData(res) {
      var RATE = 200,
          LEN = (1000 * 10)/ RATE,
          count = 0,
          cycle = 0;

      db = res;

      // parsing the key from the url
      var cs = $routeParams.team;
      if (cs) {
        cs = cs.match(/([a-z0-9]{3})/g);
        if (cs.length == 12) {
          for (var i=0; i<db.committees.length; i++) {
            var id = parseInt(cs[i],36);
            var j = db.committees[i].id;
            key.chairs[j] = db.candidates[id];
            if (id > 0)
              key.length ++
          }
        }
        else {
          $log.error("got a bad key in the url - "+$routeParams.team);
          $location.path('/error/1/home');
        }
      }
      $scope.key = key;
      // add the `abs and `rel` url properties to `key`
      key.rel = $location.url();
      key.abs = ($location.port() == 443)?
        'https://'+ $location.host()+key.rel:
        'https://'+ $location.host()+':'+$location.port()+key.rel;

      var emptyChairs = 12;
      for (var i=0; i < db.committees.length; i++) {
        var j = db.committees[i].id;
        var s = $window.sessionStorage.getItem(toKey(j));
        if (s && eval(s)) {
          myChairs[j] = db.candidates[eval(s)];
          emptyChairs--;
        }
      }
      $scope.myChairs = myChairs;
      $scope.emptyChairs = emptyChairs;
      // get an array with diffrences between session's key
      // and `key.chairs`
      for (var i=0; i < db.committees.length; i++) {
        var c = db.committees[i];
        var j = db.committees[i].id;
        if (myChairs[j] != key.chairs[j]) {
          console.log(myChairs[j]);
          diff.push({name: c.name,
                   id: c.id,
                   chosen: myChairs[j],
                   suggested: db.candidates[key.chairs[j]].name,
                   suggestedId: key.chairs[j],
                  });
        }
      }
      $scope.diff = (diff.length)?diff:0;
      $scope.key = key;
      $window.sessionStorage.setItem("stage", 'ready');
      $timeout(drawKey);
    };

    $scope.buttonSub = true;
    return $q.all({
      candidates: OPEN_KNESSET.get_candidates(),
      committees: OPEN_KNESSET.get_committees()
    }).then(fillData);

  });