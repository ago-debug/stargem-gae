import { describe, it, expect } from 'vitest';
import { splitFullName } from './splitFullName';

describe('splitFullName', () => {
  it('should handle single names', () => {
    expect(splitFullName('Marco')).toEqual({ firstName: 'Marco', lastName: '' });
  });

  it('should handle standard firstname lastname', () => {
    expect(splitFullName('Marco Maccari')).toEqual({ firstName: 'Marco', lastName: 'Maccari' });
    expect(splitFullName('MARCO MACCARI')).toEqual({ firstName: 'MARCO', lastName: 'MACCARI' });
  });

  it('should handle double first names', () => {
    expect(splitFullName('Maria Giulia Rossi')).toEqual({ firstName: 'Maria Giulia', lastName: 'Rossi' });
  });

  it('should handle last names with prefixes', () => {
    expect(splitFullName('Luigi De Luca')).toEqual({ firstName: 'Luigi', lastName: 'De Luca' });
    expect(splitFullName('Giovanna Di Battista')).toEqual({ firstName: 'Giovanna', lastName: 'Di Battista' });
    expect(splitFullName('Jan Van der Berg')).toEqual({ firstName: 'Jan', lastName: 'Van der Berg' });
    expect(splitFullName('Mario Lo Cascio')).toEqual({ firstName: 'Mario', lastName: 'Lo Cascio' });
  });

  it('should handle edge cases like dotted names', () => {
    expect(splitFullName('P. Agostino')).toEqual({ firstName: 'P.', lastName: 'Agostino' });
  });

  it('should handle empty or null values', () => {
    expect(splitFullName(null)).toEqual({ firstName: '', lastName: '' });
    expect(splitFullName('')).toEqual({ firstName: '', lastName: '' });
    expect(splitFullName('   ')).toEqual({ firstName: '', lastName: '' });
  });
});
