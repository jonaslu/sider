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
      COMPREPLY=( $(compgen -W "-h --help redis mariadb postgres" -- "${argv[1]}") )
    ;;
  esac
}

__sider_db() {
  local argv=("$@")
  local argvlen="${#argv[@]}"

  if [ $argvlen = 1 ]; then
    COMPREPLY=( $(compgen -W "clone eject list promote remove reset start help" -- "${argv[0]}") )
    return 0
  fi

  local subcommand="${argv[0]}"
  case $subcommand in
    help)
      if [ $argvlen = 3 ]; then
        return 0
      fi

      COMPREPLY=( $(compgen -W "clone eject list promote remove reset start" -- "${argv[1]}") )
    ;;
    clone)
      if [ $argvlen = 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help" -- "${argv[1]}") )
      fi

      if [ $argvlen = 3 ]; then
        local basePath=~/.sider
        if [ -e ~/.siderrc ]; then
          basePath=$(cat ~/.siderrc | grep basePath | sed -E 's/\s*"basePath":\s+"(.+)"$/\1/')
        fi

        basePath="${basePath/#\~/$HOME}/snapshots/*"

        COMPREPLY=( $(compgen -W "$(find $basePath -type d -prune -printf "%f ")" -- ${argv[2]}) )
      fi
    ;;
  esac
}

__sider() {
  local cur prev words cword
  _init_completion || return

  local second="${words[1]}"

  if [ $prev = "sider" ]; then
    COMPREPLY=( $(compgen -W "engine db snapshot" -- $cur) )

    return 0
  fi;

  case $second in
    db)
      __sider_db "${words[@]:2}"
    ;;
    engine)
      __sider_engine "${words[@]:2}"
    ;;
    snapshot)
    ;;
  esac
}

complete -F __sider sider
