<img src="assets/logo.svg" height=200 style="margin-bottom: 20px">

# Introduction
Sider is a command-line tool for installing, running, ruining and reverting databases locally..

![The-power-of-sider](/assets/the-power-of-sider.gif?raw=true)

Sider was created because there's always a database somewhere. System-wide installs is cumbersome and reusing system-wide databases over several projects gets out of hand. Sider is a quick start and go solution.

In sider a fresh database is a simple terminal command away. Run it and when done shut it down via ctrl+c.

Internally sider manages bind-mounts to persist the data and uses official docker images. You work on copies of your data and can revert back to the initial state anytime. You can also set and save ports and versions on each individual database.

# For the impatient and brave
Say to yourself: "I have docker and nodejs installed" three times.

```
npm i -g @jonaslu/sider
sider install-completion # Currently only bash supported
sider help
sider <command> help
sider <tab><tab>
```

Sider was built by swedish hands and is therefore obnoxiously overly helpful. Each command and subcommand comes with an explanatory help. Just leave out any mandatory parameter and there wil be a help message to get you moving.

Check the [wiki](https://github.com/jonaslu/sider/wiki) - at least the [changelog](https://github.com/jonaslu/sider/wiki/Changelog) if you are upgrading.

# Table of contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Getting it](#getting-it)
- [Quick guide](#quick-guide)
  - [Engine](#engine)
  - [Snapshots](#snapshots)
  - [Databases](#databases)
  - [Runtime settings](#runtime-settings)
  - [Configuration file](#configuration-file)
- [More commands](#more-commands)
  - [Listing settings](#listing-settings)
  - [Removing settings](#removing-settings)
  - [Removing snapshots and databases](#removing-snapshots-and-databases)
  - [Renaming snapshots and databases](#renaming-snapshots-and-databases)
  - [Ejecting and promoting](#ejecting-and-promoting)
- [Upgrading from an older version](#upgrading-from-an-older-version)
- [Changelog](#changelog)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation

## Prerequisites
Sider depends on the [docker cli](https://docs.docker.com/engine/reference/commandline/cli/) for running the different supported database engines. You must have docker installed and on your path.

Type: `docker info` in  a terminal. You'll get a `command not found` if docker is not installed.

## With nodejs already installed
`npm install -g @jonaslu/sider`

## Via homebrew
```
brew tap jonaslu/tools
brew install sider
```


# Quick guide
The most essential commands and terminology in sider to get you going.

If you're running bash you can type `sider install-completion` and tab-tab away to your hearts content.
See [issues](https://github.com/jonaslu/sider/issues) for progress on more shells.

## Engine
The supported database types are called an engine. Currently supported:
- Redis
- Postgres
- Mariadb
- Mongodb

## Snapshots
A snapshot is a holder of files containing data. A snapshot is immutable once created. You can import existing data-files from another engine of the same type or create an empty snapshot and seed it with data yourself.

Sider supports importing:
* Redis [snapshot](https://redis.io/docs/management/persistence/#snapshotting) file [dump.rdb](https://redis.io/docs/manual/persistence/#snapshotting)
* Mongodbs [data-directory](https://www.mongodb.com/docs/manual/tutorial/manage-mongodb-processes/#start-mongod-processes) directory
* Postgres [data-directory](https://www.postgresql.org/docs/current/storage-file-layout.html) which defaults to `/var/lib/pgsql/data`
* Mariadbs [data-directory](https://mariadb.com/docs/skysql-dbaas/ref/mdb/system-variables/datadir/) which defaults to `/var/lib/mysql`

Dumps produced by [mongodump](https://www.mongodb.com/docs/database-tools/mongodump/), [mariadb-dump/mysqldump](https://mariadb.com/kb/en/mariadb-dump/) and [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.htm) cannot be imported directly as snapshots. They can easily be restored into an running empty snapshot. Reasons and procedure described [here](https://github.com/jonaslu/sider/wiki/Copy-a-live-postgres-database).

Import data-files as a snapshot:
```
sider snapshot add <engine-name> <snapshot-name> <path-to-data-files>
```

Create an empty snapshot:
```
sider snapshot empty <engine-name> <snapshot-name>
```
Then press `ctrl+c` once done manually seeding data.

List all the snapshots:
```
sider snapshot list
```

## Databases
The database is a cloned copy of a snapshot. The data in a database is mutable.  This is what you use when you do work.

Clone database from a snapshot:
```
sider db clone <database-name> <snapshot-name>
```

Start the database:
```
sider db start <database-name>
```

Any logs from the engine is written to the terminal. Press `ctrl+c` to shut down the database. Databases can be started again whereas snapshots are either imported or seeded once.

Reset back the database to it's initial cloned state:
```
sider db reset <database-name>
```

List all the databases:
```
sider db list
```

The listing contains info on creation date, last usage date, originating snapshot and optionally the settings (via the `-s` flag).

## Runtime settings
Each engine (database type) has settings that control what port and what version you run, plus any custom settings supported by that engine.

### Setting settings
The engine itself will provide the default port (e g port for MariaDB is 3306) and the latest version.

If the defaults are overriden on the engine level they apply for all cloned databases using that engine. If overriden on the snapshot level they apply for all cloned databases of that snapshot. If overridden on the database level they apply for all runs of that database. And if applied on the command line they apply only for that run of the database (unless the `-p` flag is given).

Settings are prioritized in the order: engine, snapshot, database and command line. If the same setting is set on two or more levels the highest priority is applied.

Persist settings on the respective level:
```
sider engine setconf <setting1=value> <setting2=value> ...
sider snapshot setconf  <setting1=value> <setting2=value> ...
sider db setconf  <setting1=value> <setting2=value> ...
sider db start -p <cloned-database> <setting1=value> <setting2=value> ...
sider snapshot empty -p <engine-name> <snapshot-name> <setting1=value> <setting2=value> ...
```

Apply settings for this run but do not persist them:
```
sider db start <cloned-database> <setting1=value> <setting2=value> ...
sider snapshot empty <engine-name> <snapshot-name> <setting1=value> <setting2=value> ...
```

**Example:** `sider engine setconf redis port=6780 version=3.2.6`

**Example:** `sider engine remconf redis port version`

Phew! Well done for getting this far. When you feel ready there is [more you can do](#more-commands).

## Configuration file
Sider will by default put all snapshots, databases and stored settings in the `~/.sider` folder.
You can change this by adding an `~/.siderrc` file. The .siderrc is a json-file with the following format.
```
{
  "basePath": "~/.sider"
}
```

# More commands
Now that you've got it going - there is more that you can do.

## Listing settings
List settings on the respective level:
```
sider engine getconf <engine-name>
sider snapshot getconf <snapshot-name>
sider db getconf <database-name>
```

The `-s` flag in `sider db list -s` will show a column with the settings actually applied (via priority) when the db is started.

## Removing settings
Remove settings on the respective level:
```
sider engine remconf <setting1> <setting2> ...
sider snapshot remconf <setting1> <setting2> ...
sider db remconf <setting1> <setting2> ...
```

## Removing snapshots and databases
Even the finest database or snapshot eventually has to go.

Remove a snapshot or database:
```
sider snapshot remove <snapshot-name>
sider db remove <database-name>
```

If there are any cloned databases from a snapshot they will be removed when the snapshot is removed.

## Renaming snapshots and databases
When did you get the name right the first time? Thought so.

Rename a snapshot or database:
 ```
 sider snapshot mv <snapshot-name> <new-snapshot-name> 
 sider db mv <database-name> <new-database-name>
 ```

## Ejecting and promoting
If you want to get the data-files out of a database (in order to import it elsewhere) you can do this via:
```
sider db eject <database-name> <eject-path>
```

The eject path will contain the ejected files.

Once in a while you get something right. If a database is so right it ought to be a snapshot instead this can be done via:
```
sider db promote <database-name> <snapshot-name>
```

# Upgrading from an older version
When any snapshots, databases or settings needs to be patched due to changes or bugs a migration is supplied.

Any migrations are applied automatically when installing via npm as a postinstall hook.
If there are any errors during the migration an error log will be supplied.

You can (but are strongly advised not to to) opt out of the migration during upgrade by running `npm i -g --ignore-scripts @jonaslu/sider`.
The migrations can then manually be run via `sider migrate`. Not that sider might be broken until migrations are applied.

Currently there are migrations when upgrading from version:
* v0.0.8
* v1.0.0
* v1.1.0

# Changelog
Changes from version to version are documented in the [changelog](https://github.com/jonaslu/sider/wiki/Changelog).