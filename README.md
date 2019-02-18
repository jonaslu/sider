# What the heck is this?
It's like a VCS for your database dumps with batteries included.

I've often set up a complicated test-scenario
in my database only to have a slip of the "continue"
finger botch all of that setup overwriting the data.

The thing is exacerbated by database dumps often being
complicated to restore or reset with scarry sudo-rights
writing into the wrong directory. Same with running two databases side by side - sudoisms abound!

Enter **sider** which is a cli-tool that turns this juggling into a breeze by
handling setup, running and restoring databases for you.

# How to use it

## Common use case scenario:
Here's a every day usage scenario to get your appetite up:

```
$> sider add snapshot redis prod-180922 /home/jonas/temp/dump.rdb

$> sider snapshot list
┌─────────────┬────────┬──────────────┬──────────────┬─────┐
│ name        │ engine │ created      │ last used    │ dbs │
├─────────────┼────────┼──────────────┼──────────────┼─────┤
│ prod-180922 │ redis  │ a minute ago │ a minute ago │     │
└─────────────┴────────┴──────────────┴──────────────┴─────┘

$> sider db start test-feature-1 prod-180922
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
✨ Starting db test-feature-1 on port 6379
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

...Oh, I wrote the program but can't remember that command-line switch...
$> sider --help
```

# Before we install: a word on

## ...snapshots
A snapshot is like a commit or errr... snapshot
of a database. This is what you export from somehwere (most often your prod database)
and add into sider. This is then what you then run a db from (via an engine). There is also an option to start with an empty database (no import dump required).

## ...dbs
Dbs is the database files that the engine manipulates.
It's the running live version of a database.

## ...engines
An engine is the type of database.
Examples of types of databases are mysql, postgres, redis or what have you.
An engine knows how to run a particular type of dump. Sider currently
supports redis and postgres (more on the way).

## ...settings
Setting govern what port the db starts up at and can hold other settings too depending on what
the engine supports (e g redis currently supports version also). The engine itself will provide
any default settings it needs to be able to run a dump.

These settings can be overriden on 3 levels: engine, db and command-line.
They are also prioritized in that order. To set a config (e g the starting
port) for an engine type:
`sider engine setconf redis port=1234`

This setting will override the default and be used for all coming
invocations where the db or command-line settings have not been specified.

To list the settings on an engine (example redis) type:
`sider engine getconf redis`.
This will mix any defaults with any explicitly set values via `setconf`.

The engine setting can be overriden on a db-level. This setting
will be used for all future invocations on that db. This gives you
the ability to start dbs on different ports.

To set port on a particular db type:
`sider db setconf <db-name> port=1234`

To list the stored settings on a db type:
`sider db getconf <db-name>`. To get the full overview of what settings will be used
(a merge of the engine and db settings) you can do that in the
`sider db list -s` where `-s` lists the merged settings.

Lastly you can also set settings on the command-line. They are
used for that invocation only (but if the parameter `-p` is given when
running `sider db start` the setting will be persisted (akin to calling
`sider db setconf`)).

Example:
`sider db start my-db port=1234 version=3.2.1`

The settings can be removed on an engine and db via `remconf`.

# Installation

## Prerequisistes
Sider currently only depends on [docker](https://www.docker.com/) for running the different
supported database engines. You must have docker installed
and on your path. Test it by issuing: `docker info` in  a terminal.
If there is some output from docker you're good to go.

## Getting it
`npm install -g jonaslu/sider`

## Working with snapshots
`sider snapshot add <engine-type> <snapshot-name> <path-to-snapshot>`

This will load the database dump into sider using the specified engine-type
to load and process the database dump files.

It will not touch or alter any of the original files. When done you will
now have a snapshot loaded which can be listed with: `sider snapshot list`.

When you're done with a snapshot you can issue
`sider snapshot remove <snapshot-name>`. This will delete the
snapshot and any associated dbs with it.

If you want do start working with an entirely empty database and
no dump is required you can start sider with the `sider snapshot add -e <engine-type> <snapshot-name> switch to let the database create an empty database as a snapshot.
Do anything you need with the empty snapshot (such as setting up base-data)
and then hit ctrl+c to stop and save it as a snapshot.

## Working with dbs
First of all a db has to be cloned out from a snapshot. This makes snapshots
safe from overwrites since they are never touched by the engine. Cloning is done via
`sider db start <db-name> <snapshot-name>`. If you don't specify a port the
db will start on the default port of that engine (e g port 6379 for redis).

If you wish to start it on a different port than the default this is done
by adding the `port=<port-number>` key value last in the command invocation.
The port will be used for this run only. If you pass `-p` in addition sider will
persist this non-default port and subsequent starts will be on whatever specified port.

You can later change the port setting via `sider db setconf port=1234`.

You stop the engine running the db by hitting ctrl+c in the terminal
you stated it in. It will save state and shutdown properly.

To start the db again issue `sider db start <db-name>`. Any parameters stored
with `-p` will be used again. To see or change what config parameters have been
persisted with a particular db issue `sider db getconf <db-name>`. Parameters
are changed with `setconf` and removed with `remconf`.

You can list current dbs by issuing: `sider db list`. Adding a `-s` will list
the settings on all databases (settings are the merged version of the engine
settings and the database settings).

When you're done with a
db it can be removed by `sider db remove <db-name>`. If you've reached a state
that you'd like to save you can promote a db to a snapshot by
issuing: `sider db promote <db-name> <new-snapshot-name>`.

And if you've f-ed up some data and like to go back to where you came from
you can issue: `sider db reset <db-name>`. This will reset the database
back to the snapshot from where it was cloned.

## Configuring it
Sider can be configured by adding a .siderrc to your home-folder. The .siderrc
is a json-file. You can set the following values and will default to these
if you don't:
```
basePath: '~/.sider',
snapshotsFolder: 'snapshots/',
dbsFolder: 'dbs/',
engineFolder: 'engines/'
```

The basepath is where sider will put all of it's data files. The snapshots
folder is appended to the basePath to get the storage for snap-shots and
the same goes for dbs and stores settings for the engines.

# Migrating
If there are any breaking changes, there will be some sort
of automated migration. Here's how you run them.

## v0.0.1 -> v0.0.2
What changed:
Port is no longer included in the db path, but stored as a config parameter.
This script gets the port and stores it in the db config then moving
the files in the port folder to a level above.

To run it:
`curl -sS https://raw.githubusercontent.com/jonaslu/sider/master/migrations/v0.0.1-v0.0.2/index.js | node`

# Implementing your own engine
Technically sider handles the juggling of paths and configs. It stores loaded
dumps as snapshots, copies files to run as dbs and merges configs. The engine
runner (if you opt to use docker) needs to

## Assumptions
Sider is built upon one assumptions: there is one data-file or data-folder that
can be used repeatedly via docker (for now).

## Three methods you should know about
In order to add your missing engine to sider you need to implement three methods for that specific engine.

## Loading a database
```javascript
load(dumpBasePath, snapshotStoreFolder, config)
```
This is where files gets imported into sider.
The engine will know about any coversion that
needs to be done and should probably do some
basic sanity checking on the given files
or folders (such as the files having the
right extension and format).

The load method takes three arguments: where the file(s)
are currently located on the file-system, the output folder
where any processed files are put.

The config parameter is not yet used but will in the future
contain any settings done on the engine affecting the import
(such as version)

No return values are expected.

## Get default config
```javascript
getConfig(storedSettings)
```

Handles merging of default config with
any stored settings on that engine.

The getConfig has one argument: any stored
settings on the engine (done my running
`sider engine setconf <engine> <some=setting>).

Expected to return the merged stored settings
with any default settings. These settings
are used for merging with db settings and
cli settings when passed back starting the database.

## Starting a database
```javascript
start(dbPath, dbName, config)
```

The magic of actually starting the database. This is where you'd figure out
the docker incantation for running a database against a given data-folder provided by sider.

Takes three arguments: the path to where the data-files are located on
disk (sider copies the snapshot folder on start). If you're using
docker this would be the folder mounted in as a docker volume at
the corret database data-directory.

The second parameter is the name of the database. This should
be used for naming a docker-container so it's identifiable via
the `docker ps` command. This is useful for any external access
and manipulation of the running container via docker commands.

The third parameter is the resulting config of merging the
engine defaults given in `getConfig` with any database or
command-line overrides. The engine should perform some validation
on the given parameters issuing warnings or errors.

The method is expected to return promise that resolves when
the user shuts down the engine (presses ctrl+c).
