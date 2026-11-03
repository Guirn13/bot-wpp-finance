const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { Periodo } = require('../../src/domain/value-objects/Periodo')
const { PeriodoInvalidoError } = require('../../src/domain/errors/PeriodoInvalidoError')

const FUSO_SAO_PAULO = 'America/Sao_Paulo'

describe('Periodo', () => {
  describe('dia', () => {
    it('usa o dia de São Paulo, não o dia UTC', () => {
      const instanteDeReferencia = new Date('2026-03-11T01:30:00Z')
      const periodo = Periodo.de('dia', {
        agora: instanteDeReferencia,
        fuso: FUSO_SAO_PAULO,
      })

      assert.equal(periodo.inicio.toISOString(), '2026-03-10T03:00:00.000Z')
      assert.equal(periodo.fim.toISOString(), '2026-03-11T03:00:00.000Z')
    })

    it('é um intervalo semiaberto [inicio, fim)', () => {
      const periodo = Periodo.de('dia', {
        agora: new Date('2026-03-10T15:00:00Z'),
        fuso: FUSO_SAO_PAULO,
      })

      assert.ok(periodo.contem(periodo.inicio))
      assert.ok(periodo.contem(new Date(periodo.fim.getTime() - 1)))
      assert.ok(!periodo.contem(periodo.fim))
    })
  })

  describe('semana', () => {
    it('começa no domingo e termina no domingo seguinte', () => {
      const periodo = Periodo.de('semana', {
        agora: new Date('2026-03-11T15:00:00Z'),
        fuso: FUSO_SAO_PAULO,
      })

      assert.equal(periodo.inicio.toISOString(), '2026-03-08T03:00:00.000Z')
      assert.equal(periodo.fim.toISOString(), '2026-03-15T03:00:00.000Z')
    })

    it('no próprio domingo, a semana começa naquele dia', () => {
      const periodo = Periodo.de('semana', {
        agora: new Date('2026-03-08T12:00:00Z'),
        fuso: FUSO_SAO_PAULO,
      })

      assert.equal(periodo.inicio.toISOString(), '2026-03-08T03:00:00.000Z')
    })

    it('atravessa a virada de mês', () => {
      const periodo = Periodo.de('semana', {
        agora: new Date('2026-10-02T15:00:00Z'),
        fuso: FUSO_SAO_PAULO,
      })

      assert.equal(periodo.inicio.toISOString(), '2026-09-27T03:00:00.000Z')
      assert.equal(periodo.fim.toISOString(), '2026-10-04T03:00:00.000Z')
    })
  })

  describe('mes', () => {
    it('vai do dia 1 ao dia 1 do mês seguinte', () => {
      const periodo = Periodo.de('mes', {
        agora: new Date('2026-02-15T12:00:00Z'),
        fuso: FUSO_SAO_PAULO,
      })

      assert.equal(periodo.inicio.toISOString(), '2026-02-01T03:00:00.000Z')
      assert.equal(periodo.fim.toISOString(), '2026-03-01T03:00:00.000Z')
    })

    it('na noite do último dia do mês (já próximo mês em UTC) ainda é o mês corrente', () => {
      const periodo = Periodo.de('mes', {
        agora: new Date('2026-02-01T02:00:00Z'),
        fuso: FUSO_SAO_PAULO,
      })

      assert.equal(periodo.inicio.toISOString(), '2026-01-01T03:00:00.000Z')
      assert.equal(periodo.fim.toISOString(), '2026-02-01T03:00:00.000Z')
    })

    it('dezembro vira para janeiro do ano seguinte', () => {
      const periodo = Periodo.de('mes', {
        agora: new Date('2026-12-20T12:00:00Z'),
        fuso: FUSO_SAO_PAULO,
      })

      assert.equal(periodo.fim.toISOString(), '2027-01-01T03:00:00.000Z')
    })
  })

  it('respeita fusos com horário de verão', () => {
    const periodo = Periodo.de('dia', {
      agora: new Date('2026-03-08T18:00:00Z'),
      fuso: 'America/New_York',
    })

    assert.equal(periodo.inicio.toISOString(), '2026-03-08T05:00:00.000Z')
    assert.equal(periodo.fim.toISOString(), '2026-03-09T04:00:00.000Z')
  })

  it('rejeita tipos desconhecidos', () => {
    assert.throws(() => Periodo.de('ano'), PeriodoInvalidoError)
  })
})

