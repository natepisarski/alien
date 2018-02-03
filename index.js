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
        startAction: (object = undefined) => {},
        finalAction: (object = undefined) => {},
        stepAction: (name = undefined) => {},
        allowUnsafeFinalization: true
    }
}

export const ℿ = (builderArray, options) => {
    const getValueOrDefault = (section, ident) => ( options && options[section] && (options[section][ident] !== null && options[section][ident] !== undefined ))
        || alienDefaults[section][ident]

    const start = getValueOrDefault('advanced', 'startAction')
    const finalAction = getValueOrDefault('advanced', 'finalAction')
    const stepAction =  getValueOrDefault('advanced', 'stepAction')
    const allowUnsafeFinalization = getValueOrDefault('advanced', 'allowUnsafeFinalization')

    let nameTransformer =   getValueOrDefault('control', 'nameTransformer')
    let setterTransformer = getValueOrDefault('control', 'setterTransformer')
    let setObjects =      getValueOrDefault('control', 'setObjects')
    const createBlankProperty = getValueOrDefault('control', 'createBlankProperty')

    const schema = getValueOrDefault('objectUtilities', 'schema')
    const reset =  getValueOrDefault('objectUtilities', 'reset')

    const removeUnused =  getValueOrDefault('finalization', 'removeUnused')
    const removeSetters = getValueOrDefault('finalization', 'removeSetters')

    let builderObject = {}

    start(builderObject)

    if(schema) {
        builderObject.schema = {keys: [], setters: []}
    }

    let finalizeActions = []

    // Step 1: Iterate over the builder array
    for(const parameter of builderArray) {
        const name = nameTransformer(parameter)
        const setterName = setterTransformer(parameter)

        if(createBlankProperty) {
            builderObject[name] = undefined
        }

        builderObject[[setterName]] = (value) => {builderObject[[name]] = value; return builderObject}

        if(schema) {
            if(builderObject.schema) {
                builderObject.schema.keys.push(name)
                builderObject.schema.setters.push(setterName)
            }

        }
        stepAction(name)
    }

    if(setObjects) {
        if(schema) {
            builderObject.set = (setObject) => {
                for(const key of Object.keys(setObject)) {
                    if (builderObject.schema.keys.includes(key)) {
                        builderObject[[key]] = setObject[key]
                    }
                }
                return builderObject
            }
        } else if(allowUnsafeFinalization) {
            builderObject.set = (setObject) => {
                for(const key of Object.keys(setObject)) {
                    builderObject[[key]] = setObject[[key]]
                }
                return builderObject
            }
        }
    }

    if(removeSetters) {
        if(schema) {
            finalizeActions.push(() => {
                for (const setter of builderObject.schema.setters) {
                    delete builderObject[setter]
                }
            })
        } else if(allowUnsafeFinalization) {
            finalizeActions.push( () => {
                for(const setter of Object.keys(builderObject)) {
                    if(unsafeIsSetter(builderObject[setter])) {
                        delete builderObject[setter]
                    }
                }
            })
        }
    }

    if(reset) {
        if(schema) {
            builderObject.reset = () => {
                for(const key of builderObject.schema.keys) {
                    if(createBlankProperty) {
                        builderObject[[key]] = undefined
                    } else {
                        delete builderObject[[key]]
                    }
                }
            }
        } else if(allowUnsafeFinalization) {
            builderObject.reset = () => {
                for(const key of Object.keys(builderObject)) {
                    if(!unsafeIsSetter(builderObject[[key]])) {
                        if(createBlankProperty) {
                            builderObject[[key]] = undefined
                        } else {
                            delete builderObject[[key]]
                        }
                    }
                }
            }
        }
    }

    if(removeUnused && createBlankProperty) {
        if(schema) {
            finalizeActions.push(() => {
              for(const key of builderObject.schema.keys) {
                  if(key === undefined) {
                      delete builderObject[[key]]
                  }
              }
            })
        } else if(allowUnsafeFinalization) {
            finalizeActions.push(() => {
              for(const key of Object.keys(builderObject)) {
                  if(!unsafeIsSetter(builderObject[[key]])) {
                      delete builderObject[[key]]
                  }
              }
            })
        }
    }

    let finish = () => {
        for(const action of finalizeActions) {
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

// TODO: Known to be broken: RemoveUnused, CreateBlankProperty
// TODO: Unit tests
// TODO POSSIBLE NAMES: Փ, ℿ,
