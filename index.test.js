import {ℿ} from './index'


describe('alien basic functionality', () => {
    test('works on just a list', () => {
        let setNameUnsetEmail = ℿ(['name', 'email'])
        setNameUnsetEmail.setName('John')

        // Tests create-time setting
        expect(setNameUnsetEmail.name.length).toBe(4)
        expect(setNameUnsetEmail.email).toBeUndefined()

        // Tests ex-post facto setting
        setNameUnsetEmail.setEmail('john@email.com')
        expect(setNameUnsetEmail.email.indexOf('.')).toBe(10)
    })
})

describe('Alien finalizers', () => {
  test('RemoveUnused properly works', () => {
      let setNameUnsetEmail = ℿ(['name', 'email'], {finalization: {removeUnused: true}}).setName('John')
      setNameUnsetEmail.finalize()

      expect(setNameUnsetEmail.name).toBe('John')
      expect(setNameUnsetEmail).not.toHaveProperty('email')
  })
    test('RemoveSetters properly works', () => {
      let setNameUnsetEmail = ℿ(['name', 'email'], {finalization: {removeSetters: true}})
        setNameUnsetEmail.setName('John')
        setNameUnsetEmail.finalize()

        expect(setNameUnsetEmail.name).toBe('John')

        expect(setNameUnsetEmail.email).toBeUndefined()
        expect(setNameUnsetEmail.setEmail).toBeUndefined()
        expect(setNameUnsetEmail.setName).toBeUndefined()
    })
})

describe('Alien Control properties', () => {
    test('nameTransformer properly works', () => {
      let setNameUnsetEmail = ℿ(['name', 'email'], {control: { nameTransformer: (name => "_" + name)}})
        setNameUnsetEmail.setName('John')

        expect(setNameUnsetEmail._name).toBe('John')
        expect(setNameUnsetEmail._email).toBeUndefined()
    })

    test('setterTransformer properly works', () => {
        let setNameUnsetEmail = ℿ(['name', 'email'], {control: {setterTransformer: (name => "_" + name)}})
        setNameUnsetEmail._name('John')

        expect(setNameUnsetEmail.name).toBe('John')
        expect(setNameUnsetEmail.email).toBeUndefined()
    })

    test('setObjects properly works', () => {
        let setNameSetEmail = ℿ(['name', 'email'], {control: {setObjects: true}}).set({name: 'John', email: "john@email.com"})

        expect(setNameSetEmail.name).toBe('John')
        expect(setNameSetEmail.email).toBe('john@email.com')
    })

    test('createBlankProperty properly works', () => {
        let blankSetNameUnsetEmail = ℿ(['name', 'email'], {control: {createBlankProperty: true}})
        let setNameUnsetEmail = ℿ(['name', 'email'], {control: {createBlankProperty: false}})

        blankSetNameUnsetEmail.setName('John')

        expect(blankSetNameUnsetEmail.email).toBeUndefined()
        expect(setNameUnsetEmail.email).not.toBeDefined()
    })
})

describe('Alien Advanced properties', () => {
  test('startAction properly works', () => {
    let setNameUnsetEmail = ℿ(['name', 'email'], {advanced: {startAction: (builder) => builder.SEE_IF_I_EXIST = 'yes'}}).setName('John')

      expect(setNameUnsetEmail.SEE_IF_I_EXIST).toBe('yes')
  })

    test('stepAction properly works', () => {
        let setNameSetEmail = ℿ(['name', 'email'], {advanced: {stepAction: (builder, name) => builder.count = (builder.count || 0) + 1}})
            .setName('John')
            .setEmail('john@email.com')

        expect(setNameSetEmail.count).toBe(2)
    })

    test('finalAction properly works', () => {
      let setNameUnsetEmail = ℿ(['name', 'email'], {advanced: {finalAction: builder => builder.email = 'john@email.com'}})
          .setName('John')
          .finalize()

        expect(setNameUnsetEmail.email).toBe('john@email.com'       )
    })
})
