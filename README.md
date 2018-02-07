# alien version 0.1.0
Before I bore you with use-cases and details, look at these few examples:

**Basic Usage**
```javascript
ℿ(['name', 'email']).setName('Nathaniel').setEmail('Nathaniel@website.com')
```
**Configuring Output**
```javascript
ℿ(['name'], {c: {s: t => `_${t}`}})._name("Nathaniel")
```

**Advanced Settings**
```javascript
const schema = ℿ(['SSN'], {ob: true}).schema
```

# What is alien?
Alien (invoked via `alien()` or `ℿ`) is a system for building **cascadable** object factories. You define the properties of your object,
and it generates a **fluent interface** that allows the caller to chain `set` commands. So, instead of:

```javascript
myObject.prop1 = "Hey"
myObject.prop2 = "There"
```
you get:

```javascript
myObject.setProp1("Hey").setProp2("There")
```

This, in combination with pure functions, creates a powerful, expressive means of modifying your DTOs.

# Absolutely Everything is Configurable
Let's say you don't like `set[Property]` as the property syntax. You can pass in the `setterTransformer` 
property to change it to `_[Property]`, or `changeTheValueOf[Property]To`, or whatever you want. It's all up to the caller.

You can configure:

* Whether or not to keep unset variables (`finalization.removeUnused`)
* Whether or not to remove the setters (`finalization.removeSetters`)
* Whether or not to build a schema (`objectUtilities.schema`) (you always want this unless memory usage is a gigantic concern)
* Whether or not to add a `.reset()` that blanks the properties (`objectUtilities.reset`)
* How to name the properties (`control.nameTransformer`)
* How to name the setters (`control.setterTransformer`)
* Whether or not to add a `.set({prop: 'val'})` interface (`control.setObjects`)
* Whether you initialize properties are `undefined` or simply don't add them (`control.createBlankProperty`)
* What to do when the object begins building (`advanced.startAction`)
* What to do when the object is about to be done building (`advanced.finalAction`)
* What to do every time a property is processed (when it's making the setters) (`advanced.stepAction`)
* Whether or not to override the schema step and use unsafe validation (`advanced.allowUnsafeInitialization`)

## Saving Space
Any of the options are configurable with the least amount of characters to uniqueled identify the setting...  (what?)

So, `control.nameTransformer` can be set with `{c: {n" true}}` (c = `control`, n = `nameTransformer`)
