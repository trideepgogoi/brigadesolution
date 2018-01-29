//jshint esversion:6

var fs = require('fs');
var readline = require('readline');
// Input is via a CLI TRUE means interactive mode
// False signifies that file was provided via a STDIN Stream
// Example: node dependencymanager.js < filename.txt
var cliInput = true;

/**
 * component - Each component is a node that has a list of deoendency.
 * This will create a directed graph
 *
 * @param  {string} componentName Name of the component
 */
function component (componentName) {
  this.installed = false;

  // Comonent was installed implicitly to satisfy a dependency
  this.implicitlyInstalled = false;
  this.name = componentName;

  // This holds all the dependencies
  this.deps = [];

  //Add to list of Components
  Components.componentList[componentName] = this;
}


/**
 * addDependency - Add a dependency
 *
 * @param  {type} componentName name of the component
 */
component.prototype.addDependency = function(componentName) {
  let newComponent = Components.componentList[componentName] || new component(componentName);
  this.deps.push(newComponent);
};


/**
 * checkDependency - Verify if a component is a dependency
 *
 * @param  {string} componentName component name
 * @return {boolean} is the component required
 */
component.prototype.checkDependency = function(componentName) {
  for(let i = 0; i < this.deps.length; i++) {
    if(this.deps[i].name === componentName && this.installed) {
      return true;
    }
  }

  return false;
};


/**
 * install - Install the component
 *
 * @param implicitInstall {boolean} Installed implicetly.
 */
component.prototype.install = function(implicitInstall) {
  if(this.installed) {
    console.log('   %s is already installed.', this.name);
    return;
  }
  this.installed = true;
  if(implicitInstall) {
    this.implicitlyInstalled = true;
  }
  console.log('   Installing %s', this.name);
};


/**
 * uninstall - component to uninstall
 *
 * @param onlyIfImplicit {boolean} Only remove if implicitly installed
 */
component.prototype.uninstall = function(onlyIfImplicit) {
  if(onlyIfImplicit && !this.implicitlyInstalled) {
    return;
  }
  this.installed = false;
  console.log('   Removing %s', this.name);
};


/**
 * Singleton that implments the Components list tree
 * For performance's sake all the comnponents are stored in an array. Each node is a graph head
 */
var Components = {
  // List of all installed components
  componentList: {},


  /**
   * installComponent - Install a given component. If a componentname is not found create it
   * Recursively walks into the Dependency tree to install required dependencies
   *
   * @param  {string} componentName The name of the component
   * @param {boolean} implicitInstall Install implicitly as a dependency requirement
   */
  installComponent: function(componentName, implicitInstall) {
    if(!Components.componentList[componentName]) {
      // Not listed in dependency tree thus no dependencies
      // Add and Install
      let installedComponent = new component(componentName);
      installedComponent.install();
    } else {
      // fetch component
      let componentToInstall = Components.componentList[componentName];
      // if no dependencies install
      if(componentToInstall.deps.length === 0) {
        // Install component
        componentToInstall.install(implicitInstall);
      } else {
        // Loop over dependencies and Install dependencies
        componentToInstall.deps.forEach(function(cmp){
          if(!cmp.installed) {
            Components.installComponent(cmp.name, true);
          }
        });

        componentToInstall.install(implicitInstall);
      }
    }
  },

  /**
   * list - List all currently installed components
   *
   * @return {type}  description
   */
  list: function() {
    for(let i in Components.componentList) {
      if(Components.componentList.hasOwnProperty(i) && Components.componentList[i].installed) {
        console.log('   ', i);
      }
    }
  },


  /**
   * remove - Remove a given component.
   * Only remove if nothing else depends on it.
   * Also remove Dependents if nothing else depends on them
   *
   * @param componentName {string} name of component to remove
   * @param silentRemove {boolean} remove silently no console output
   *                                This will also prevent the deletion of
   *                                inner dependencies and implicitly installed modules
   * @return {type}  description
   */
  remove: function(componentName, silentRemove) {
    let componentToRemove = Components.componentList[componentName];
    let componentChain = [];

    // Check if already uninstalled
    if(!componentToRemove || !componentToRemove.installed) {
      if(!silentRemove) {
        console.log('   %s is not installed.', componentName);
      }
      return;
    }

    // Get list of components that still need this component
    componentChain = Components.neededBy(componentName);

    // The Component is needed by other Components
    // We CANNOT remove
    if(componentChain.length > 0) {
      if(!silentRemove) {
        console.log('   %s is still needed.', componentName);
      }
      return;
    } else {
      componentToRemove.uninstall(silentRemove);

      // Remove Dependencies for an app
      componentToRemove.deps.forEach(function(dep){
        Components.remove(dep.name, true);
      });
    }
  },


  /**
   * neededBy - Finds components that depend on a given component
   *
   * @param  {string} componentName Component name
   * @return {array}  The dependent components by name. Empty array means the
   *                  component is not a dependency for other components
   */
  neededBy: function(componentName) {
    let dependencyList = [];
    // loop over the list of components and get them by Dependency
    for (var i in Components.componentList) {
      if(Components.componentList.hasOwnProperty(i)) {
        let currentComponent = Components.componentList[i];
        if(currentComponent.checkDependency(componentName)) {
          dependencyList.push(currentComponent.name);
        }
      }
    }
    return dependencyList;
  }
};


/**
 * processCommand - Handled each line of input
 *
 * @param  {type} command Command line Example DEPEND module dep1 dep2 dep3
 * @return {type}         description
 */
function processCommand(command) {
  let commands = command.split(/\ +/);
  let verb = commands[0];
  let componentName = commands[1];

  // If input came from a instream file we need to output the command
  if(!cliInput) {
    console.log(command);
  }
  switch (verb) {
    case('END'):
      process.exit();
      break;
    case('DEPEND'):
      let componentToDepend = Components.componentList[componentName] || new component(componentName);
      for (let i = 2; i < commands.length; i++) {
        componentToDepend.addDependency(commands[i]);
      }
    break;
    case 'INSTALL':
      Components.installComponent(componentName);
      break;
    case 'LIST':
      Components.list();
      break;
    case 'REMOVE':
      Components.remove(componentName);
  }
}


/**
 * runCli - Runs the CLI by reading a file
 *
 * @return {type}  description
 */
function runCli() {
  cliInput = process.stdin.isTTY;
  let input = process.stdin;
  let linereader = readline.createInterface({
    input:input
  });

  if(cliInput) {
    console.log('Provide Inputs folowed by the enter key \n EXAMPLE: \n DEPEND TCPIP NETCARD');
    console.log('OR pass in file as: node %s < INPUT-FILE-NAME \n', require('path').basename(__filename));
  }

  linereader.on('line', function(line){
    processCommand(line);
  });
}

// Run the CLI
runCli();
