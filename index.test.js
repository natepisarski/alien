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
})