__sider_engines="redis mariadb postgres"

# Returns the .siderrc (or default) basePath
__sider_get_base_path() {
  basePath=~/.sider
  if [ -e ~/.siderrc ]; then
    basePath=$(cat ~/.siderrc | grep basePath | sed -E 's/\s*"basePath":\s+"(.+)"$/\1/')
  fi
}

# Returns the array in the variable result
__sider_get_completions_for() {
  local type=$1
  local basePath
  __sider_get_base_path

  local typePath="${basePath/#\~/$HOME}/$type/*"

  result=$(find $typePath -type d -prune -printf "%f " 2> /dev/null)
}

__sider_engine() {
  local argv=("$@")

  if [ "${#argv[@]}" = 3 ]; then
    return 0
  fi

  if [ "${#argv[@]}" = 1 ]; then
    COMPREPLY=( $(compgen -W "setconf getconf remconf help" -- "${argv[0]}") )
    return 0
  fi

  local subcommand="${argv[0]}"
  case $subcommand in
    help)
      COMPREPLY=( $(compgen -W "setconf getconf remconf" -- "${argv[1]}") )
      ;;
    *)
      COMPREPLY=( $(compgen -W "-h --help ${__sider_engines}" -- "${argv[1]}") )
      ;;
  esac
}

__sider_snapshot() {
   local argv=("$@")
  local argvlen="${#argv[@]}"

  if [ $argvlen = 1 ]; then
    COMPREPLY=( $(compgen -W "add empty list remove getconf setconf remconf help" -- "${argv[0]}") )
    return 0
  fi

  local subcommand="${argv[0]}"
  case $subcommand in
    help)
      if [ $argvlen = 3 ]; then
        return 0
      fi

      COMPREPLY=( $(compgen -W "add empty list remove getconf setconf remconf" -- "${argv[1]}") )
      ;;

    add)
      if [ $argvlen = 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help ${__sider_engines}" -- "${argv[1]}") )
      fi

      if [ $argvlen = 4 ]; then
        compopt -o default
        COMPREPLY=()
        return 0
      fi
      ;;

    empty)
      if [ $argvlen = 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help -p ${__sider_engines}" -- "${argv[1]}") )
      fi

      if [ $argvlen = 3 ] && [ ${argv[1]} = "-p" ]; then
        COMPREPLY=( $(compgen -W "${__sider_engines}" -- "${argv[2]}") )
      fi
      ;;
  esac
}

__sider_db() {
  local argv=("$@")
  local argvlen="${#argv[@]}"

  if [ $argvlen = 1 ]; then
    COMPREPLY=( $(compgen -W "clone eject getconf list promote remove reset start help" -- "${argv[0]}") )
    return 0
  fi

  local subcommand="${argv[0]}"
  case $subcommand in
    help)
      if [ $argvlen = 3 ]; then
        return 0
      fi

      COMPREPLY=( $(compgen -W "clone eject list promote remove reset start getconf" -- "${argv[1]}") )
      ;;

    clone)
      if [ $argvlen = 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help" -- "${argv[1]}") )
      fi

      if [ $argvlen = 3 ]; then
        local result
        __sider_get_completions_for "snapshots"

        if [ "$result" = "" ]; then
          return 0
        fi

        COMPREPLY=( $(compgen -W "$result" -- ${argv[2]}) )
      fi
      ;;

    start)
      local result
      __sider_get_completions_for "dbs"

      if [ $argvlen = 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help -p ${result}" -- "${argv[1]}") )
      fi

      if [ $argvlen = 3 ] && [ ${argv[1]} = "-p" ]; then
        COMPREPLY=( $(compgen -W "${result}" -- "${argv[3]}") )
      fi
      ;;

    eject)
      local result
      __sider_get_completions_for "dbs"

      if [ $argvlen = 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help ${result}" -- "${argv[1]}") )
      fi

      if [ $argvlen = 3 ]; then
        compopt -o default
        COMPREPLY=()
        return 0
      fi
      ;;

    getconf|remove|reset|promote)
      local result
      __sider_get_completions_for "dbs"

      if [ $argvlen = 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help ${result}" -- "${argv[1]}") )
      fi
      ;;

    list)
      if [ $argvlen = 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help" -- "${argv[1]}") )
      fi
      ;;
  esac
}

__sider() {
  local cur prev words cword
  _init_completion || return

  if [ $prev = "sider" ]; then
    COMPREPLY=( $(compgen -W "engine db snapshot" -- $cur) )
    return 0
  fi;

  # Help guard - if any command has -h or --help after it, terminate completion
  if [ $prev = '-h' ] || [ $prev = '--help' ]; then
    return 0
  fi

  local second="${words[1]}"
  case $second in
    db)
      __sider_db "${words[@]:2}"
    ;;
    engine)
      __sider_engine "${words[@]:2}"
    ;;
    snapshot)
      __sider_snapshot "${words[@]:2}"
    ;;
  esac
}

complete -F __sider sider
