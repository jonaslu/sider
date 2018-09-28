# What the heck is this?
It's like a VCS for your database dumps with batteries included.

I've often set up a complicated test-scenario
in my database only to have a slip of the "continue"
finger botch all of that setup overwriting the data.
Rinse and repeat.

The thing is exacerbated by database dumps often being
complicated to restore or reset with scarry sudo-rights
writing into the wrong directory.

Running databases side by side or on different ports is the same story.
Sudo-isms and crazy configs.

Enter **sider** which is a cli-tool that turns this juggling into a breeze by
running a db cloned from a snapshot on an engine on any
port - and remembers that port on subsequent startups.

# Before we install: a word on

## ...snapshots
A snapshot is like a commit or errr... snapshot
of a database. This is what you export from somehwere and add into sider.
This is then what you then run databases from (via an engine).

## ...dbs
Dbs is the database files that the engine manipulates.
It's the running live version of a database.

## ...engines
An engine is the type of database.
Examples of types of databases are mysql, postgres, redis or what have you.
An engine knows how to run a particular type of dump. Sider currently
supports redis and postgres (more on the way).

# Installation

## Prerequisistes
Sider currently only depends on [docker](https://www.docker.com/) for running the different
supported database engines. You must have docker installed
and on your path. Test it by issuing: `docker info` in  a terminal.
If there is some output from docker you're good to go.

## Getting it
`npm install -g jonaslu/sider`

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

$> sider db start test-feature-2 prod-180922
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
┌────────────────┬─────────────┬────────┬──────┬───────────────────┬───────────────────┐
│ name           │ snapshot    │ engine │ port │ created           │ last used         │
├────────────────┼─────────────┼────────┼──────┼───────────────────┼───────────────────┤
│ test-feature-1 │ prod-180922 │ redis  │ 6379 │ a minute ago      │ a minute ago      │
├────────────────┼─────────────┼────────┼──────┼───────────────────┼───────────────────┤
│ test-feature-2 │ prod-180922 │ redis  │ 6379 │ a few seconds ago │ a few seconds ago │
└────────────────┴─────────────┴────────┴──────┴───────────────────┴───────────────────┘

$> sider db start -p 6380 test-feature-1
✨ Starting db test-feature-1 on port 6380
```

## Working with snapshots

`sider snapshot add <engine-type> <snapshot-name> <path-to-snapshot>`

This will load the database dump into sider using the specified engine-type
to load and process the database dump files.

It will not touch or alter any of the original files. When done you will
now have a snapshot loaded which can be listed with: `sider snapshot list`.

When you're done with a snapshot you can issue
`sider snapshot remove <snapshot-name>`. This will delete the
snapshot and any associated dbs with it.

## Working with dbs
First of all a db has to be cloned out from a snapshot. This makes snapshots
safe from overwrites since they are never touched by the engine. Cloning is done via
`sider db start <db-name> <snapshot-name>`. If you don't specify a port the
db will start on the default port of that engine (e g port 6379 for redis).

If you wish to start it on a different port than the default this is done
by adding the `-p <port-number>` parameter. Sider will remember this
non-default port and subsequent starts will be on whatever specified port.

You stop the engine running the db by hitting ctrl+c in the terminal
you stated it in. It will save state and shutdown properly.

To start the db again issue `sider db start <db-name>`. If you
whish to temporarily override the port used to clone the snapshot with
add `-p <port-number>` to start the db on that port for this invocation.

You can list current dbs by issuing: `sider db list`.

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
dbsFolder: 'dbs/'
```

The basepath is where sider will put all of it's data files. The snapshots
folder is appended to the basePath to get the storage for snapshots and
the same goes for dbs.
