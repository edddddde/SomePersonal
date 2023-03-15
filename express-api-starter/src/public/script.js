let clicked = false;

let generateId = () => {
  return new Date().getTime();
}

let taskId = "-1";

$(function () {
  $(".submit-btn").on("click", function () {
    setTaskId();
    if (!clicked) {
      $('.resultBoard').text("");
      clicked = true;
      $.get("/api/debug", {
        query: $('#query').val(),
        flights: $('#flights').val(),
        features: $('#features').val(),
        market: $('#market').val(),
        language: $('#language').val(),
        params: $('#params').val(),
        id: taskId,
      });
      $('.loading').show();
      let itv = setInterval(() => {
        $.get('/api/queryResult', {id: taskId}, function(data, status) {
            if (data) {
                clicked = false;
                $('.resultBoard').html(data);
                clearInterval(itv);
                $('.loading').hide();
            }
        })
      }, 1000);
    }
  })
});

function setTaskId() {
  taskId = generateId();
}