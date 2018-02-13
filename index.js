import {head, filter, size, map} from 'lodash'

const toCamelCase = (prefix, string) => {
    return ('' + prefix + (string.charAt(0).toUpperCase()) + string.substring(1, string.length))
}

const unsafeIsSetter = candidate => candidate && {}.toString.call(candidate) === '[object Function]'

const first = (list, predicate) => head(filter(list, predicate))

const stringArrayOperation = (string, operation) => operation(string.split('')).join('')

const camelCaseInitialism = word => word.substring(0, 1) + stringArrayOperation(word, characters => filter(characters, character => character.toUpperCase() === character))

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

export const fastOption = (fastOption) => {
    // {f: {ru: true, rs: true}, o: {r: false}}
    // Step 1: Find first expansion of item
    // Step 2: For each property, find first expansion and replace

    const fastOptionKeys = Object.keys(fastOption)
    const optionKeys = Object.keys(alienDefaults)

    const findFirstTakeMatch = (keyList, fastOptionKey) => first(keyList, key => key.substring(0, size(fastOptionKey)) === fastOptionKey)
    const camelCaseInitialismMatch = (keyList, fastOptionKey) => findFirstTakeMatch(map(keyList, camelCaseInitialism), fastOptionKey)

    const test = (keyList, fastOptionKey) => findFirstTakeMatch(keyList, fastOptionKey) || camelCaseInitialismMatch(keyList, fastOptionKey)

    let providedOptions = {}

    // For each top-level key
    for(const fastOptionKey of fastOptionKeys) {

        // Get the alien option name for the top level
        const topLevelKey = test(optionKeys, fastOptionKey)
        let topLevelOptions = {}

        const innerKeys = Object.keys(fastOption[fastOptionKey])

        for(const innerFastOptionKey of innerKeys) {
            const innerOptions = Object.keys(alienDefaults[[topLevelKey]])
            const selectedOption = test(innerOptions, innerFastOptionKey)
            topLevelOptions[[selectedOption]] = fastOption[[fastOptionKey]][[innerFastOptionKey]]
        }
        providedOptions[[topLevelKey]] = topLevelOptions
    }

    return providedOptions
}

export const ℿ = (builderArray, alienOptions) => {
    let options = (alienOptions && fastOption(alienOptions)) || alienDefaults
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