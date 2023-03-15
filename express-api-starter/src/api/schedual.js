const { taskList, taskManager, taskStatus } = require("./taskList.js");
const {DomTest} = require('./checkv2.js');
exports.scheduleTask = async() => {
    setInterval(() => {
        if (taskManager.taskRunningCount <= taskManager.maxTaskRunning) {
            for (var i = 0; i < taskList.length; i++) {
                if (taskList[i].status == taskStatus.waiting) {
                    taskManager.taskRunningCount++;
                    taskList[i].status = taskStatus.running
                    DomTest(taskList[i]);
                }
            }
        }
    }, 500);
}