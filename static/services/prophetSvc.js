angular.module('propheteer').service('prophetSvc', function ($http) {
  const service = this

  service.runPrediction = function (prophetModel) {
    var data = _.map(prophetModel.data, function (item) {
      return {
        ds: new Date(item[prophetModel.dateVariable]),
        y: item[prophetModel.targetVariable]
      }
    })
    return $http.post('/prophet/predict', JSON.stringify({data: data}))
  }
})
