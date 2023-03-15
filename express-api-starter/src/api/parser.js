const { taskList, taskStatus } = require("./taskList.js");

exports.parser = (query) => {
    let task = {};
    for (let key in query) {
        task[key] = query[key];
    }
    task.status = taskStatus.waiting;
    insertTask(task);
}

let insertTask = (task) => {
    taskList.push(task);
}