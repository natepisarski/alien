import {head, filter, size, map, findIndex} from 'lodash'

/**
 * Modify a string while adhering to camel-casing
 * @param {string} prefix - The lower-case first word. i.e `set` in `setName`
 * @param {string} string - The string to put into camel case
 * @returns {string} The new string
 * @nosideeffects
 */
const toCamelCase = (prefix, string) => 
    ('' + prefix + (string.charAt(0).toUpperCase()) + string.substring(1, string.length))


/**
 * See if an object is a function or lambda
 * @param {function} candidate - The property of the method to test
 * @returns {*|boolean} Whether or not the property appears to be a function
 * @nosideeffects
 */
const unsafeIsSetter = candidate => candidate && {}.toString.call(candidate) === '[object Function]'

/**
 * Utility method for getting the first item of a list, optionally where a predicate holds true
 * @param {Array<T>} list - The list to test
 * @param {function(T)} predicate - The predicate that returns true of false. Defaults to always being true
 * @returns {T} The first item in the list where the predicate holds true
 * @nosideeffects
 */
const first = (list, predicate = () => true) => head(filter(list, predicate))

/**
 * Perform an operation on a string as an array of characters, and then convert it back to a string
 * @param {string} string - The string to perform the operation on
 * @param {function(*)} operation - the operation to perform on the character array
 * @returns {string} The character array converted back into a string
 */
const stringArrayOperation = (string, operation) => operation(string.split('')).join('')

/**
 * Finds the camelCase initialism of a string. The initialism of 'setTheProperty' would be 'stp', etc.
 * @param {string} word - The word to find the initialism of
 * @returns {string} The word, converted to an initialism
 * @nosideeffects
 */
const camelCaseInitialism = word => word.substring(0, 1) + stringArrayOperation(word, characters => filter(characters, character => character.toUpperCase() === character))

/**
 * The complete list of default options. This is parsed to determine what non-default options and fast-options resolve to
 * @type {{finalization: {removeUnused: boolean, removeSetters: boolean}, objectUtilities: {schema: boolean, reset: boolean}, control: {nameTransformer: function(*): *, setterTransformer: function(*=): string, setObjects: boolean, createBlankProperty: boolean}, advanced: {startAction: function(*=), finalAction: function(*=), stepAction: function(*=, *=), allowUnsafeFinalization: boolean}}}
 */
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

/**
 * Given a top-level fast-option (i.e {c: {nT: t => t}}), resolve it to options that alien understands in terms of defaults
 * @param {Object} fastOption -  The complete fast-option object
 * @returns {Object} The fully resolved result
 */
export const fastOption = (fastOption) => {

    const fastOptionKeys = Object.keys(fastOption)
    const optionKeys = Object.keys(alienDefaults)

    const findFirstTakeMatch = (keyList, fastOptionKey) => first(keyList, key => key.substring(0, size(fastOptionKey)).toUpperCase() === fastOptionKey.toUpperCase())
    const camelCaseInitialismMatch = (keyList, fastOptionKey) =>
    {
        const camelCaseInitialisms = map(keyList, camelCaseInitialism)

        const matchingInitialism = findFirstTakeMatch(camelCaseInitialisms, fastOptionKey)
        return keyList[[findIndex(camelCaseInitialisms, cci => cci === matchingInitialism)]]
    }

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

/**
 * The entry point of alien.
 * @param builderArray - An array of strings that become the schema and property names
 * @param alienOptions - A list of options, either as fully resolved options or fast options
 * @returns {Object} The fully built builder object, complete with cascadable setters
 */
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
        const currentName = typeof parameter === 'object' ? first(Object.keys(parameter)) : parameter
        const name = nameTransformer(currentName)
        const setterName = setterTransformer(currentName)

        if (createBlankProperty) {
            builderObject[name] = undefined
        }

        if(typeof parameter === 'object') {
            builderObject[name] = parameter[currentName]
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

/**
 * An ASCII way to call the alien library
 * @type {function(*, *=)} A copy of the alien function
 */
export const alien = ℿ
