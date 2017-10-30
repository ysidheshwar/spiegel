'use strict'

const slouch = require('./slouch')
const UpdateListeners = require('./update-listeners')
const ChangeListeners = require('./change-listeners')
const Replicators = require('./replicators')
const OnChanges = require('./on-changes')

class Spiegel {
  constructor (type, opts) {
    this._type = type

    this._slouch = slouch
    this._dbName = opts && opts.dbName ? opts.dbName : 'spiegel'

    // Used to create a separate namespace for testing
    this._namespace = opts && opts.namespace ? opts.namespace : ''

    this._updateListeners = new UpdateListeners(this, opts)
    this._changeListeners = new ChangeListeners(
      this,
      opts && opts.changeListener ? opts.changeListener : undefined
    )
    this._replicators = new Replicators(this, opts && opts.replicator ? opts.replicator : undefined)
    this._onChanges = new OnChanges(this)
  }

  async install () {
    await this._slouch.db.create(this._dbName)
    await this._slouch.security.onlyAdminCanView(this._dbName)
    await this._updateListeners.install()
    await this._changeListeners.install()
    await this._onChanges.install()
    await this._replicators.install()
  }

  async uninstall () {
    await this._changeListeners.uninstall()
    await this._updateListeners.uninstall()
    await this._replicators.uninstall()
    await this._onChanges.uninstall()
    await this._slouch.db.destroy(this._dbName)
  }

  async start () {
    switch (this._type) {
      case 'update-listener':
        await this._onChanges.start()
        await this._updateListeners.start()
        break

      case 'change-listener':
        await this._onChanges.start()
        await this._changeListeners.start()
        break

      case 'replicator':
        await this._replicators.start()
        break
    }
  }

  async stop () {
    switch (this._type) {
      case 'update-listener':
        await this._onChanges.stop()
        await this._updateListeners.stop()
        break

      case 'change-listener':
        await this._onChanges.stop()
        await this._changeListeners.stop()
        break

      case 'replicator':
        await this._replicators.stop()
        break
    }
  }

  async installIfNotInstalled () {
    let exists = await this._slouch.db.exists(this._dbName)
    if (!exists) {
      await this.install()
    }
  }
}

module.exports = Spiegel
