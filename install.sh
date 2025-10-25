#!/bin/sh
#
# This script should be run via curl:
#   sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
# or via wget:
#   sh -c "$(wget -qO- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
# or via fetch:
#   sh -c "$(fetch -o - https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
#
# As an alternative, you can first download the install script and run it afterwards:
#   curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -o install.sh
#   sh install.sh
#
# You can tweak the install behavior by setting variables before running the script.
# For example, to change the path to the Oh My Zsh repository:
#   export ZSH=/path/to/oh-my-zsh
#   sh install.sh
#
# To skip the chsh step on a remote machine:
#   export CHSH=no
#   sh install.sh
#
# To skip running zsh after installation:
#   export RUNZSH=no
#   sh install.sh
#
# To keep the existing .zshrc file:
#   export KEEP_ZSHRC=yes
#   sh install.sh
#
# You can also pass arguments to the script to set the variables.
# For example, to change the path to the Oh My Zsh repository:
#   sh install.sh --zsh=/path/to/oh-my-zsh
#
# To skip the chsh step on a remote machine:
#   sh install.sh --skip-chsh
#
# To skip running zsh after installation:
#   sh install.sh --skip-run-zsh
#
# To keep the existing .zshrc file:
#   sh install.sh --keep-zshrc
#
# To set the ZSH_CUSTOM path:
#   sh install.sh --custom=/path/to/custom
#
# To set the ZSH_CACHE_DIR path:
#   sh install.sh --cache-dir=/path/to/cache
#
# To install for a different user:
#   sh install.sh --user=someuser
#
# To clone a different branch than master:
#   sh install.sh --branch=somebranch
#
# To clone a different remote than origin:
#   sh install.sh --remote=someremote
#
# To clone with a different repository URL:
#   sh install.sh --repo=someuser/ohmyzsh
#
# To install without cloning the repository:
#   sh install.sh --skip-clone
#
# To install without setting up the zshrc file:
#   sh install.sh --skip-zshrc
#
# To install without setting the default shell:
#   sh install.sh --skip-chsh
#
# To install without running zsh at the end:
#   sh install.sh --skip-run-zsh
#
# To install without showing the final message:
#   sh install.sh --quiet
#
# To install without doing anything:
#   sh install.sh --dry-run
#
# To uninstall Oh My Zsh:
#   sh install.sh --uninstall
#
# To see the help message:
#   sh install.sh --help
#

set -e

# Make sure important variables are set
[ -z "$ZSH" ] && export ZSH="$HOME/.oh-my-zsh"
[ -z "$ZSH_CUSTOM" ] && export ZSH_CUSTOM="$ZSH/custom"
[ -z "$ZSH_CACHE_DIR" ] && export ZSH_CACHE_DIR="$ZSH/cache"

# Set default values for arguments
ZSH_REPO="ohmyzsh/ohmyzsh"
ZSH_REMOTE="origin"
ZSH_BRANCH="master"
CHSH="yes"
RUNZSH="yes"
KEEP_ZSHRC="no"
QUIET="no"
DRY_RUN="no"
UNINSTALL="no"
SKIP_CLONE="no"
SKIP_ZSHRC="no"

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --zsh=*)
      ZSH="${1#*=}"
      ;;
    --custom=*)
      ZSH_CUSTOM="${1#*=}"
      ;;
    --cache-dir=*)
      ZSH_CACHE_DIR="${1#*=}"
      ;;
    --user=*)
      USER="${1#*=}"
      ;;
    --repo=*)
      ZSH_REPO="${1#*=}"
      ;;
    --remote=*)
      ZSH_REMOTE="${1#*=}"
      ;;
    --branch=*)
      ZSH_BRANCH="${1#*=}"
      ;;
    --skip-chsh)
      CHSH="no"
      ;;
    --skip-run-zsh)
      RUNZSH="no"
      ;;
    --keep-zshrc)
      KEEP_ZSHRC="yes"
      ;;
    --quiet)
      QUIET="yes"
      ;;
    --dry-run)
      DRY_RUN="yes"
      ;;
    --uninstall)
      UNINSTALL="yes"
      ;;
    --skip-clone)
      SKIP_CLONE="yes"
      ;;
    --skip-zshrc)
      SKIP_ZSHRC="yes"
      ;;
    --help)
      # Show help message
      echo "Usage: install.sh [options]"
      echo
      echo "Options:"
      echo "  --zsh=<path>         Path to the Oh My Zsh repository (default: $HOME/.oh-my-zsh)"
      echo "  --custom=<path>      Path to the Oh My Zsh custom directory (default: $ZSH/custom)"
      echo "  --cache-dir=<path>   Path to the Oh My Zsh cache directory (default: $ZSH/cache)"
      echo "  --user=<user>        Install for a different user"
      echo "  --repo=<repo>        Clone a different repository (default: ohmyzsh/ohmyzsh)"
      echo "  --remote=<remote>    Clone a different remote (default: origin)"
      echo "  --branch=<branch>    Clone a different branch (default: master)"
      echo "  --skip-chsh          Skip the chsh step"
      echo "  --skip-run-zsh       Skip running zsh after installation"
      echo "  --keep-zshrc         Keep the existing .zshrc file"
      echo "  --quiet              Install without showing the final message"
      echo "  --dry-run            Install without doing anything"
      echo "  --uninstall          Uninstall Oh My Zsh"
      echo "  --skip-clone         Install without cloning the repository"
      echo "  --skip-zshrc         Install without setting up the zshrc file"
      echo "  --help               Show this help message"
      exit 0
      ;;
    *)
      # Unknown option
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
  shift
done

# Functions
setup_color() {
	# Only use colors if connected to a terminal
	if [ -t 1 ]; then
		RED=$(printf '\033[31m')
		GREEN=$(printf '\033[32m')
		YELLOW=$(printf '\033[33m')
		BLUE=$(printf '\033[34m')
		BOLD=$(printf '\033[1m')
		RESET=$(printf '\033[m')
	else
		RED=""
		GREEN=""
		YELLOW=""
		BLUE=""
		BOLD=""
		RESET=""
	fi
}

command_exists() {
	command -v "$@" >/dev/null 2>&1
}

error() {
	echo "${RED}Error: ${RESET}$@" >&2
}

underline() {
	printf '\033[4m%s\033[24m\n' "$@"
}

# Main
main() {
  # Run as another user if requested
  if [ -n "${USER}" ] && [ "${USER}" != "$(whoami)" ]; then
    # Check if the user exists
    if ! id -u "${USER}" >/dev/null 2>&1; then
      error "User ${USER} does not exist"
      exit 1
    fi

    # Check if we are running as root
    if [ "$(whoami)" != "root" ]; then
      error "You must be root to install for another user"
      exit 1
    fi

    # Set the home directory
    export HOME=$(eval echo "~${USER}")

    # Set the ZSH variable
    [ -z "$ZSH" ] && export ZSH="$HOME/.oh-my-zsh"

    # Set the ZSH_CUSTOM variable
    [ -z "$ZSH_CUSTOM" ] && export ZSH_CUSTOM="$ZSH/custom"

    # Set the ZSH_CACHE_DIR variable
    [ -z "$ZSH_CACHE_DIR" ] && export ZSH_CACHE_DIR="$ZSH/cache"

    # Run the script as the user
    exec su - "${USER}" -c "sh -c \"$(cat $0)\""
  fi

  # Setup color
  setup_color

  # Dry run
  if [ "${DRY_RUN}" = "yes" ]; then
    echo "Dry run: This will not actually do anything"
    echo "ZSH: ${ZSH}"
    echo "ZSH_CUSTOM: ${ZSH_CUSTOM}"
    echo "ZSH_CACHE_DIR: ${ZSH_CACHE_DIR}"
    echo "ZSH_REPO: ${ZSH_REPO}"
    echo "ZSH_REMOTE: ${ZSH_REMOTE}"
    echo "ZSH_BRANCH: ${ZSH_BRANCH}"
    echo "CHSH: ${CHSH}"
    echo "RUNZSH: ${RUNZSH}"
    echo "KEEP_ZSHRC: ${KEEP_ZSHRC}"
    echo "QUIET: ${QUIET}"
    echo "UNINSTALL: ${UNINSTALL}"
    echo "SKIP_CLONE: ${SKIP_CLONE}"
    echo "SKIP_ZSHRC: ${SKIP_ZSHRC}"
    exit 0
  fi

  # Uninstall
  if [ "${UNINSTALL}" = "yes" ]; then
    if [ -d "$ZSH" ]; then
      echo "Uninstalling Oh My Zsh"
      rm -rf "$ZSH"
      if [ -f "$HOME/.zshrc.pre-oh-my-zsh" ]; then
        mv "$HOME/.zshrc.pre-oh-my-zsh" "$HOME/.zshrc"
      fi
      echo "Uninstalled Oh My Zsh"
    else
      error "Oh My Zsh is not installed"
    fi
    exit 0
  fi

  # Check if Oh My Zsh is already installed
  if [ -d "$ZSH" ]; then
    error "Oh My Zsh is already installed in $ZSH."
    echo "You'll need to remove $ZSH if you want to re-install."
    exit 1
  fi

  # Check if zsh is installed
  if ! command_exists zsh; then
    error "zsh is not installed. Please install zsh first."
    exit 1
  fi

  # Clone the repository
  if [ "${SKIP_CLONE}" = "no" ]; then
    echo "Cloning Oh My Zsh..."
    # Check if git is installed
    if ! command_exists git; then
      error "git is not installed. Please install git first."
      exit 1
    fi

    # Clone the repository
    git clone --depth=1 "https://github.com/${ZSH_REPO}.git" "$ZSH"
  fi

  # Create the cache directory
  mkdir -p "$ZSH_CACHE_DIR"

  # Setup the zshrc file
  if [ "${SKIP_ZSHRC}" = "no" ]; then
    echo "Looking for an existing zsh config..."
    # If the user has a .zshrc file, we'll back it up and create a new one
    if [ -f "$HOME/.zshrc" ] || [ -h "$HOME/.zshrc" ]; then
      if [ "${KEEP_ZSHRC}" = "no" ]; then
        echo "Found $HOME/.zshrc. Backing up to $HOME/.zshrc.pre-oh-my-zsh"
        mv "$HOME/.zshrc" "$HOME/.zshrc.pre-oh-my-zsh"
      else
        echo "Found $HOME/.zshrc. Not backing up because KEEP_ZSHRC is set."
      fi
    fi

    echo "Using the Oh My Zsh template for zshrc and saving it to $HOME/.zshrc"
    cp "$ZSH/templates/zshrc.zsh-template" "$HOME/.zshrc"
  fi

  # Change the default shell
  if [ "${CHSH}" = "yes" ]; then
    echo "Changing the default shell to zsh..."
    # Check if we can change the shell
    if ! chsh -s "$(command -v zsh)"; then
      error "Could not change the default shell. Please do it manually."
    fi
  fi

  # Run zsh
  if [ "${RUNZSH}" = "yes" ]; then
    echo "Running zsh..."
    exec zsh
  fi

  # Show the final message
  if [ "${QUIET}" = "no" ]; then
    printf '%s' "${GREEN}"
    cat <<-'EOF'
		__                                     __
	 _ __   / /_     ____ ___  __  __   ____  _____/ /
	/ __ \/ __ \   / __ `__ \/ / / /  /_  / / ___/ /
	/ /_/ / / / /  / / / / / / /_/ /    / /_(__  ) /
	\____/_/ /_/  /_/ /_/ /_/\__, /    /___/____/_/
	                        /____/
	EOF
    printf '%s' "${RESET}"
    echo
    echo "Please restart your terminal to start using Oh My Zsh!"
    echo
    echo "For more information, please see https://github.com/ohmyzsh/ohmyzsh"
    echo
  fi
}

main "$@"
