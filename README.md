# Elevator pitch
Sider is a command-line tool for running and restoring multiple databases locally.

# Longer story
Sider was born out of frustration of often fetching a production-dump,
starting it up locally and then accidentally destroying it whilst debugging and having to do
the process all over again.

There was also the issue of running two or more
databases of the same type on different ports locally, which is often tricky to do
 with a system-wide install.

Using docker to bind-mount in the dump was a bit better
since you could run multiple databases at the same time
on different ports, but still painful since labeling, copying
and setting up the docker mounts took time and concentration.

Sider is the answer to this. I wanted a tool to manage several database
dumps locally at once. I wanted to run some or all of them
at the same time and when I did destroy some crucial
data I wanted to quickly revert to the fetched dump being able
to start over again.

# For the impatient and brave
Say to yourself: "I have docker installed" three times.

```
npm i -g @jonaslu/sider
sider install-completion
sider help
sider <tab><tab>
```

Check the [wiki](/wiki)

# Supported databases
- Redis
- Postgres
- Mariadb

# Common use case scenario:
Here's a every day usage scenario to get your appetite up:

```
$> sider snapshot add redis prod-180922 /home/jonas/temp/dump.rdb

$> sider snapshot list
┌─────────────┬────────┬──────────────┬──────────────┬─────┐
│ name        │ engine │ created      │ last used    │ dbs │
├─────────────┼────────┼──────────────┼──────────────┼─────┤
│ prod-180922 │ redis  │ a minute ago │ a minute ago │     │
└─────────────┴────────┴──────────────┴──────────────┴─────┘

$> sider db clone test-feature-1 prod-180922
✨ Successfully cloned database goat from snapshot yaky 🚀

$> sider db start test-feature-1
✨ Starting db test-feature-1 on port 6379
... hack hack ...
... Stuck, I'll work on feature-2 on the meantime ...
ctrl + c

$> sider db start -p test-feature-2 prod-180922 version=4.0.1
✨ Starting db test-feature-2 on port 6379
... hack hack ...
... Oh noes, I destroyed the data ...
ctrl + c

$> sider db reset test-feature-2

$> sider db start test-feature-2
✨ Starting db test-feature-2 on port 6379
... hack hack ...
... Yes, I figured out how to solve feature-1 ...

<new terminal>
$> sider db list
┌────────────────┬─────────────┬────────┬───────────────────┬───────────────────┐
│ name           │ snapshot    │ engine │ created           │ last used         │
├────────────────┼─────────────┼────────┼───────────────────┼───────────────────┤
│ test-feature-1 │ prod-180922 │ redis  │ a minute ago      │ a minute ago      │
├────────────────┼─────────────┼────────┼───────────────────┼───────────────────┤
│ test-feature-2 │ prod-180922 │ redis  │ a few seconds ago │ a few seconds ago │
└────────────────┴─────────────┴────────┴───────────────────┴───────────────────┘

$> sider db start test-feature-1 port=6380
✨ Starting db test-feature-1 on port 6380
... I think I need feature 1 to always run on port 6380...
.... ctrl + c ...

$> sider db setconf test-feature-1 port=6380

$> sider db start test-feature-1
✨ Starting db test-feature-1 on port 6380
... More than 4 seconds elapse ...
... What were the settings again?...
.... ctrl + c ...

$> sider db list -s
┌────────────────┬─────────────┬────────┬─────────────┬─────────────┬───────────────┐
│ name           │ snapshot    │ engine │ created     │ last used   │ settings      │
├────────────────┼─────────────┼────────┼─────────────┼─────────────┼───────────────┤
│ test-feature-1 │ prod-180922 │ redis  │ a day ago   │ a day ago   │ port=6380     │
│                │             │        │             │             │ version=4.0.1 │
├────────────────┼─────────────┼────────┼─────────────┼─────────────┼───────────────┤
│ test-feature-2 │ prod-180922 │ redis  │ 18 days ago │ 18 days ago │ port=6379     │
│                │             │        │             │             │ version=3.2.6 │
└────────────────┴─────────────┴────────┴─────────────┴─────────────┴───────────────┘

$> sider snapshot empty postgres my-own-snapshot
...Set up a empty database with some schema...
...And insert some data...
.... ctrl + c ...

$ sider db start my-own-db my-own-snapshot

...Oh, I wrote the program but can't remember that command-line switch...
$> sider help
```

# Terminology

## Snapshots
A snapshot is an imported dump of a database.
You can also create empty snapshots and initialize
them with data yourself.

## Databases
The database is a cloned copy of a snapshot making the
snapshot immutable and the database mutable. You can reset
a database to the initial snapshot state at any time.

## Engines
Is the supported database types - currently:
- Redis
- Postgres
- Mariadb

## Runtime settings
Settings are applied when running a database and controls
what port to run plus any other individual settings supported
by the engine (example: engine version).

The engine itself will provide default settings.
Settings can be overriden on the engine, snapshot, db and command-line
and prioritized in that order if overridden.

Settings are persisted between invocations with the exception
of command-line settings.

# Installation

## Prerequisites
Sider depends on [docker](https://www.docker.com/) for running the different
supported database engines. You must have docker installed
and on your path.

Test it by issuing: `docker info` in  a terminal.
If there is some output from docker you're good to go.

## Getting it
`npm install -g @jonaslu/sider`

If there are any breaking changes a migration will be supplied during
the upgrade process. You can (but are not advised) to opt out of the migration during upgrade.
If you do then there's will be a way of migrating manually here: [migrations](https://github.com/jonaslu/sider/wiki/Migrations).

## Installing tab-completion
Type `sider install-completion` and tab-tab away to your hearts content.
Currently bash is supported. See issues for progress on more shells.

# Usage

## Working with engines
Holds both the defaults and overridden settings
that are applied when running a database.

### Persisting settings
`sider engine setconf <name> <settings...>`

Persists one or more settings on an engine.
Any database using that engine will inherit it's settings unless overridden when started anew.

**Example:** `sider engine setconf redis port=6780 version=3.2.6`

### Listing settings
`sider engine getconf <name>`

Lists all persisted settings on an engine.

**Example:** `sider engine getconf redis`

### Removing settings
`sider engine remconf <name> <settings...>`

Removes one or more settings on an engine reverting back to the defaults.

**Example:** `sider engine remconf redis port version`

## Working with snapshots
Snapshots are dumps exported from another database.
The canonical example is getting a dump from production to work on some bug locally.

Redis accepts dump.rdb files, postgres and mariadb
accepts the contents of the data-dir.

See the [wiki](https://github.com/jonaslu/sider/wiki/Copy-a-live-postgres-database)
for importing pg_dump / mysqldump sql-files.

### Adding a snapshot
`sider snapshot add <engine-type> <name> <path-to-snapshot>`

This will load the database dump into sider using the specified engine-type
to load and process the database dump files.

It will not touch or alter any of the supplied original files.

**Example:** `sider snapshot add redis prod-dump /home/jonasl/dump.rdb`

### Adding an empty snapshot
`sider snapshot empty <engine> <name>`

Empty snapshots are handy for adding self-generated data
such as setting up schemas and test-data.

It's can also be used for importing .sql files (see the [wiki](https://github.com/jonaslu/sider/wiki/Copy-a-live-postgres-database)).

Press `ctrl+c` to stop and save the snapshot.

**Example:** `sider snapshot empty redis test-data`

### Listing imported snapshots
`sider snapshot list`

Displays a list of the currently available snapshots.

### Removing a snapshot
`sider snapshot remove <name>`

This will delete the snapshot and databases cloned from it.

**Example:** `sider snapshot remove prod-dump`

### Persisting settings
`sider snapshot setconf <name> <settings...>`

Persists one or more settings on a snapshot.
Any database cloned from this snapshot will inherit it's settings unless overridden when started anew.

**Example:** `sider snapshot setconf prod-dump port=6781 version=4.0.0`

### Listing settings
`sider snapshot getconf <name>`

Lists all persisted settings on a snapshot.

**Example:** `sider snapshot getconf prod-dump`

### Removing settings
`sider snapshot remconf <name>`

Removes one or more settings on a snapshot.

**Example:** `sider snapshot remconf prod-dump port version`

## Working with dbs
The purpose of a database is to work with and
mutate data cloned from a snapshot.

A db has to be cloned out from a snapshot and cannot be started without an associated snapshot. Thus any associated databases are deleted when a snapshot is removed.

### Cloning a snapshot
`sider db clone <name> <snapshot-name>`

Clones out a database from a snapshot. This
is the only way to add a database.

**Example:** `sider db clone bug-fix prod-dump`

### Starting a database
`sider db start [-p] <name> [settings...]`

Starts a previously cloned database. It retains
state over restarts - use sider db reset to discard any changes made.

Press `ctrl+c` to shut down the database.

Any settings are applied to this invocation only unless the flag `-p` is given. If you whish to persist settings between invocations add the `-p` flag.

**Exampless:**
```
sider db start bug-fix
sider db start bug-fix port=1234
sider db start -p bug-fix port=1234
```

You can later change or remove the persisted settings via `sider db setconf` and `sider db remconf`.

### Listing existing databases
`sider db list`

Lists the currently existing databases.

### Removing a database
`sider db remove <name>`

Removes a database.

**Example:** `sider db remove bug-fix`

### Promote a database
`sider db promote <name> <new-snapshot-name>`

A database can be promoted into a new snapshot. The new snapshot can then be used as a base for further development.

**Example:** `sider db promote bug-fix migrated-prod-data`

### Resetting a database
`sider db reset <name>`

Resets the database to the cloned snapshot state and thus discarding any changes made.

Any settings applied to database are kept even if it's reset.

**Example:** `sider db reset bug-fix`

### Ejecting a database
`sider db eject <name> <eject-path>`

This will write out the working data-files
in a database to disk. Example of this is
if you've solved a bug and like to re-import
the changes to some other environment.

The path will be create if it does not exist. The dump will be written into a subfolder named after ejected the database`

**Example** `sider db eject migrated-prod-data /home/jonasl/iwon`

### Persisting settings
`sider db setconf <name> <settings...>`

Persists one or more settings on a database.

**Example:** `sider db setconf bug-fix port=5432 version=4.0.3`

### Listing settings
`sider db getconf <name>`

Lists all persisted settings on a database.

**Example:** `sider db getconf bug-fix`

### Removing settings
`sider db remconf <name> <settings...>`

Removes one or several settings on a database.

**Example:** `sider db remconf bug-fix port version`

## Configuration file
Sider can be configured by adding a .siderrc to your home-folder. The .siderrc
is a json-file. You can set the following values and will default to these
if you don't:
```
basePath: '~/.sider',
```

Base path is the top folder where sider keeps all of it's snapshots, dbs
and settings.
