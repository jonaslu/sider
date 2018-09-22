# What it is
It's assumed that a database runs on one
port and that it somehow persists things in
files or files in subfolders of a folder.

# But I just want an empty database
The default database hack

It's a design decision to always
have an db with a corresponding
image - thus an image is needed.

But you can create a default
database easily.

# Design choices


## Storage
Deals with all things related to disk and paths
(parses paths )

Expects validated input (snapshot exists, db exists).

It's the responsibility of the caller to validate
data such as names are valid by reading
out data in the db and checking it's validity.

## Engine
Expects validated data (paths to things exist).

## Sider-db
Runs things related to dbs. Validates data such as the db
and engine exists.
