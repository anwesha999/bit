import { expect } from 'chai';
import Helper from '../e2e-helper';

describe('bit list command', function () {
  this.timeout(0);
  const helper = new Helper();
  after(() => {
    helper.destroyEnv();
  });
  describe('list before running "bit init" with .bit.map.json', () => {
    it('Should init consumer add then list component', () => {
      helper.createBitMap();
      helper.createFile('bar', 'foo.js');
      const output = helper.listLocalScope();
      expect(output.includes('found 0 components')).to.be.true;
    });
  });
  describe('when no components created', () => {
    before(() => {
      helper.cleanEnv();
      helper.initWorkspace();
    });
    it('should display "found 0 components"', () => {
      const output = helper.listLocalScope();
      expect(output.includes('found 0 components')).to.be.true;
    });
  });
  describe('when a component is created but not tagged', () => {
    before(() => {
      helper.cleanEnv();
      helper.initWorkspace();
      helper.createComponentBarFoo();
      helper.addComponentBarFoo();
    });
    it('should display "found 0 components"', () => {
      const output = helper.listLocalScope();
      expect(output.includes('found 0 components')).to.be.true;
    });
  });
  describe('when a component is created and tagged', () => {
    before(() => {
      helper.cleanEnv();
      helper.initWorkspace();
      helper.createComponentBarFoo();
      helper.addComponentBarFoo();
      helper.tagComponentBarFoo();
    });
    it('should display "found 1 components"', () => {
      const output = helper.listLocalScope();
      expect(output.includes('found 1 components')).to.be.true;
    });
    it('should list deprecated component', () => {
      helper.deprecateComponent('bar/foo');
      const output = helper.listLocalScope();
      expect(output).to.contain.string('bar/foo [Deprecated]');
    });
  });
  describe('with --outdated flag', () => {
    describe('when a remote component has a higher version than the local component', () => {
      let output;
      before(() => {
        helper.setNewLocalAndRemoteScopes();
        helper.createComponentBarFoo();
        helper.addComponentBarFoo();
        helper.tagComponentBarFoo();
        helper.exportAllComponents();
        helper.reInitLocalScope();
        helper.addRemoteScope();
        helper.importComponent('bar/foo@0.0.1');
        const clonedScopePath = helper.cloneLocalScope();

        helper.reInitLocalScope();
        helper.addRemoteScope();
        helper.importComponent('bar/foo@0.0.1');
        helper.tagComponent('bar/foo', 'msg', '-f');
        helper.exportAllComponents();

        helper.getClonedLocalScope(clonedScopePath);
        output = helper.listLocalScopeParsed('-o');
      });
      it('should show that it has a later version in the remote', () => {
        const barFoo = output.find(item => item.id === `${helper.remoteScope}/bar/foo`);
        expect(barFoo.remoteVersion).to.equal('0.0.2');
        expect(barFoo.localVersion).to.equal('0.0.1');
      });
    });
    describe('when a remote component has the same version as the local component', () => {
      let output;
      before(() => {
        helper.setNewLocalAndRemoteScopes();
        helper.createFile('bar', 'baz.js');
        helper.addComponent('bar/baz.js', { i: 'bar/baz' });
        helper.tagComponent('bar/baz');
        helper.exportAllComponents();
        helper.reInitLocalScope();
        helper.addRemoteScope();
        helper.importComponent('bar/baz@0.0.1');
        output = helper.listLocalScopeParsed('-o');
      });
      it('should display the same version for the local and remote', () => {
        const barBaz = output.find(item => item.id === `${helper.remoteScope}/bar/baz`);
        expect(barBaz.remoteVersion).to.equal(barBaz.localVersion);
      });
    });
    describe('when a component is local only (never exported)', () => {
      let output;
      before(() => {
        helper.reInitLocalScope();
        helper.createFile('bar', 'local');
        helper.addComponent('bar/local', { i: 'bar/local' });
        helper.tagComponent('bar/local');
        output = helper.listLocalScopeParsed('-o');
      });
      it('should show that the component does not have a remote version', () => {
        const barLocal = output.find(item => item.id === 'bar/local');
        expect(barLocal.remoteVersion).to.equal('N/A');
      });
    });
  });
});
