exports.taskManager = {
    maxTaskRunning: 5,
    taskRunningCount: 0
}

exports.taskList = [];

exports.taskStatus = {
    running: 0,
    waiting: 1,
    completed: 2
}