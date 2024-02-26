const DataBaseSchema = Object.freeze({
    resources : Object.freeze({
        storeName : "resources",
        key : "name",
    }),
    runningInstances : Object.freeze({
        storeName : "runningInstances",
        key : "name",
    }),
    userConfiguration : Object.freeze({
        storeName : "userConfiguration",
        key : "name",
    })
});

export default DataBaseSchema;