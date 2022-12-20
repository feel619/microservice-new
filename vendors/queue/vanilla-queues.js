"use strict";
var VanillaQueues = /** @class */ (function () {
    function VanillaQueues(queueCountInit) {
        this.doneCallback = function () { };
        this.pauseCallback = function () { };
        this.queueActual = 0;
        this.isPause = false;
        this.pauseCount = 0;
        if (queueCountInit && parseInt(queueCountInit.toString()) >= 1)
            this._queueCount = queueCountInit;
        else
            this._queueCount = 5;
        this._stackJobs = [];
    }
    VanillaQueues.prototype.stop = function () {
        this._stackJobs = [];
        this.queueActual = 0;
    };
    VanillaQueues.prototype.breakCall = function (callback, everyNumberJobDone) {
        if (!everyNumberJobDone)
            throw new Error("Method not implemented.");
    };
    VanillaQueues.prototype.pause = function (callback) {
        if (callback)
            this.pauseCallback = callback;
        this.isPause = true;
    };
    VanillaQueues.prototype.resume = function () {
        this.isPause = false;
        for (var index = this.pauseCount; index > 0; index--)
            this.jobDone();
        this.pauseCount = 0;
    };
    VanillaQueues.prototype.addJob = function (callback, transferData) {
        this._stackJobs.push({ callback: callback, data: transferData });
    };
    /**
     * name
     */
    VanillaQueues.prototype.runJobs = function () {
        if (this._stackJobs.length <= this._queueCount)
            this._queueCount = this._stackJobs.length;
        this._stackJobs = this._stackJobs.reverse();
        this.queueActual = this._queueCount;
        for (var index = 0; index < this._queueCount; index++) {
            var runInstance = this._stackJobs.pop();
            runInstance === null || runInstance === void 0 ? void 0 : runInstance.callback(runInstance.data, index);
        }
    };
    VanillaQueues.prototype.jobDone = function () {
        if (!this.isPause) {
            if (this._stackJobs.length !== 0) {
                var runInstance = this._stackJobs.pop();
                runInstance === null || runInstance === void 0 ? void 0 : runInstance.callback(runInstance.data, this._queueCount++);
            }
            else if (--this.queueActual === 0)
                this.doneCallback();
        }
        else if (this.queueActual == ++this.pauseCount)
            this.pauseCallback();
    };
    VanillaQueues.prototype.isDone = function (callback) {
        this.doneCallback = callback;
    };
    Object.defineProperty(VanillaQueues.prototype, "queueCount", {
        get: function () {
            return this._queueCount;
        },
        set: function (value) {
            this._queueCount = value;
        },
        enumerable: false,
        configurable: true
    });
    return VanillaQueues;
}());
