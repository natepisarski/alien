const toCamelCase = (prefix, string) => {
    return ('' + prefix + (string.charAt(0).toUpperCase()) + string.substring(1, string.length))
}

const unsafeIsSetter = candidate => candidate && {}.toString.call(candidate) === '[object Function]'


const alienDefaults = {
    finalization: {
        removeUnused: false,
        removeSetters: false
    },
    objectUtilities: {
        schema: true,
        reset: false
    },
    control: {
        nameTransformer: (name => name),
        setterTransformer: (name => toCamelCase('set', name)),
        setObjects: true,
        createBlankProperty: true
    },
    advanced: {
        startAction: (object = undefined) => {
        },
        finalAction: (object = undefined) => {
        },
        stepAction: (object = undefined, name = undefined) => {
        },
        allowUnsafeFinalization: true
    }
}

export const ℿ = (builderArray, options) => {
    const getValueOrDefault = (section, ident) => (options && options[section] && (options[section][ident] !== null && options[section][ident] !== undefined)) && options[section][ident]
        || alienDefaults[section][ident]

    const start = getValueOrDefault('advanced', 'startAction')
    const finalAction = getValueOrDefault('advanced', 'finalAction')
    const stepAction = getValueOrDefault('advanced', 'stepAction')
    const allowUnsafeFinalization = getValueOrDefault('advanced', 'allowUnsafeFinalization')

    let nameTransformer = getValueOrDefault('control', 'nameTransformer')
    let setterTransformer = getValueOrDefault('control', 'setterTransformer')
    let setObjects = getValueOrDefault('control', 'setObjects')
    const createBlankProperty = getValueOrDefault('control', 'createBlankProperty')

    const schema = getValueOrDefault('objectUtilities', 'schema')
    const reset = getValueOrDefault('objectUtilities', 'reset')

    const removeUnused = getValueOrDefault('finalization', 'removeUnused')
    const removeSetters = getValueOrDefault('finalization', 'removeSetters')

    let builderObject = {}

    start(builderObject)

    if (schema) {
        builderObject.schema = {keys: [], setters: []}
    }

    let finalizeActions = []

    // Step 1: Iterate over the builder array
    for (const parameter of builderArray) {
        const name = nameTransformer(parameter)
        const setterName = setterTransformer(parameter)

        if (createBlankProperty) {
            builderObject[name] = undefined
        }

        builderObject[[setterName]] = (value) => {
            builderObject[[name]] = value;
            return builderObject
        }

        if (schema) {
            if (builderObject.schema) {
                builderObject.schema.keys.push(name)
                builderObject.schema.setters.push(setterName)
            }

        }
        stepAction(builderObject, name)
    }

    const schemaOrKeys = (method, schemaTransformer = schema => schema.keys) => {
        (schema ?
            schemaTransformer(builderObject.schema)
            : (allowUnsafeFinalization
                ? Object.keys(builderObject)
                : [])).map(method)
    }

    if (setObjects) {
        builderObject.set = (setObject) => {
            schemaOrKeys(key => builderObject[[key]] = setObject[key])
            return builderObject
        }
    }

    if (removeSetters) {
        finalizeActions.push(() =>
            schemaOrKeys(key => {
                if (unsafeIsSetter(builderObject[key])) {
                    delete builderObject[key]
                }
            }, schema => schema.setters))
    }

    if (reset) {
        builderObject.reset = () => schemaOrKeys(key => {
            if (createBlankProperty) {
                builderObject[[key]] = undefined
            } else {
                delete builderObject[[key]]
            }
        })
    }

    if (removeUnused && createBlankProperty) {
        finalizeActions.push(() => {
            schemaOrKeys(key => {
                if (builderObject[key] === undefined && !unsafeIsSetter(builderObject[key])) {
                    delete builderObject[[key]]
                }
            })
        })
    }

    let finish = () => {
        for (const action of finalizeActions) {
            action()
        }
        finalAction(builderObject)
        delete builderObject.finalize
        return builderObject
    }

    builderObject.finalize = finish
    return builderObject
}

export const alien = ℿ