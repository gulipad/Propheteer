app.controller('mainController', function ($timeout, $scope, FileUploader, prophetSvc) {
  'ngInject'
  var vm = this
  const uploaderOptions = {
    queueLimit: 1,
    url: '/process_upload'
  }

  vm.possibleStates = {
    loading: 'LOADING',
    welcome: 'WELCOME',
    upload: 'UPLOAD',
    uploaded: 'UPLOADED',
    done: 'DONE'
  }

  vm.prophetModel = {
    dateVariable: null,
    targetVariable: null,
    targetUnits: null,
    data: []
  }

  vm.currentState = vm.possibleStates.welcome

  vm.columnOptions = []
  vm.uploader = new FileUploader(uploaderOptions)

  vm.uploader.onCompleteItem = function (fileItem, response, status, headers) {
    $timeout(function () {
      vm.currentState = vm.possibleStates.uploaded
    }, 800)

    var allData = JSON.parse(response.data)
    vm.columnOptions = _.keys(allData[0])
    vm.prophetModel.data = allData
  }

  vm.uploader.onProgressItem = function () {
    vm.currentState = vm.possibleStates.loading
  }

  vm.getStarted = function () {
    vm.currentState = vm.possibleStates.loading
    $timeout(function () {
      vm.currentState = vm.possibleStates.upload
    }, 800)
  }

  vm.openFileSelector = function () {
    angular.element('#file-input').trigger('click')
  }

  vm.runPrediction = async function () {
    if (!vm.prophetModel.dateVariable || !vm.prophetModel.targetVariable) {
      vm.warnSelection = true
      return
    }
    vm.currentState = vm.possibleStates.loading
    vm.processing = true
    try {
      loadProcessingText()
      var response = await prophetSvc.runPrediction(vm.prophetModel)
      vm.currentState = vm.possibleStates.done
      vm.processing = false
      $scope.$apply()
      console.log(response.data, document.getElementById('chart'))
      var basicTimeSeriesData = parseBasicData(response.data)
      computeStatistics(basicTimeSeriesData)
      $timeout(function () {
        drawChart(_.takeRight(basicTimeSeriesData, 30)) 
      })
    } catch (err) {
      console.error(err)
      vm.processing = false
    }
  }

  async function loadProcessingText () {
    vm.processingText = 'Uploading data to brain...'
    $timeout(function () {
      vm.processingText = 'Parsing data...'
      $timeout(function () {
        vm.processingText = 'Processing data...'
        $timeout(function () {
          vm.processingText = 'Rendering result...'
        }, 2000)
      }, 800)
    }, 800)
  }

  function computeStatistics(data) {
    vm.prophetModel.mean = _.meanBy(data, function (o) { return o.prediction })
    vm.prophetModel.median = median(_.map(data, 'prediction'))
    vm.prophetModel.min = _.minBy(data, function (o) { return o.prediction }).prediction
    vm.prophetModel.max = _.maxBy(data, function (o) { return o.prediction }).prediction

  }

  function drawChart (data) {
    MG.data_graphic({
      data: data,
      animate_on_load: true,
      width: 750,
      height: 400,
      target: '#chart',
      x_accessor: 'date',
      y_accessor: 'prediction',
      active_point_on_lines: true,
      active_point_accessor: 'prediction',
      active_point_size: 2,
      yax_units: vm.prophetModel.targetUnits,
      show_confidence_band: ['lower', 'upper'],
      brush: 'x'
    })
  }

  function median(numbers) {
    // median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
    var median = 0, numsLen = numbers.length;
    numbers.sort();
 
    if (
        numsLen % 2 === 0 // is even
    ) {
        // average of two middle numbers
        median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
    } else { // is odd
        // middle number only
        median = numbers[(numsLen - 1) / 2];
    }
 
    return median;
}

  function parseBasicData (allData) {
    let parsedData = _.map(allData, function (serie) {
      return {
        date: new Date(serie.ds),
        prediction: serie.yhat,
        upper: serie.yhat_upper,
        lower: serie.yhat_lower
      }
    })
    return parsedData
  }
})
