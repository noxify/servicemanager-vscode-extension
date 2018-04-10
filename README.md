# Service Manager Visual Studio Code Extension

A VSCode extenstion which allows you to create and modify Service Manager ScriptLibraries outside the Service Manager Client.

## Features

* Multiple Environments
* Create a new ScriptLibrary from a local file
* Push and Pull for ScriptLibraries
* Compile

## Installation

Just load the extension via the VSCode Marketplace.

Inside the Service Manager, you have to create a new `extaccess` record.

Please ensure that the used operator has enough permissions to create/update/compile a ScriptLibrary and that the capability `RESTful API` is set in the operator.

### Header fields

| Field Name   | Value         |
| ------------ | ------------- |
| Service Name | ScriptLibrary |
| Name         | ScriptLibrary |
| Object Name  | ScriptLibrary |

### Tab Allowed Actions

| Allowed Actions | Action Names | Action Type |
| --------------- | ------------ | ----------- |
| add             | Create       | Create only |
| save            | Update       | Update only |
| compile         | Compile      | <empty>     |

### Tab Fields

| Field   | Caption | Type    |
| ------- | ------- | ------- |
| name    | Name    | <empty> |
| package | Package | <empty> |
| script  | Script  | <empty> |

```
If you're using different Caption Names, you have to modify also the extension settings. See `fields` inside the example settings.
```

### Tab RESTful

| Field                             | Value         |
| --------------------------------- | ------------- |
| RESTful enabled                   | true          |
| Resource Collection Name          | ScriptLibrary |
| Resource Name                     | ScriptLibrary |
| Unique Keys                       | name          |
| Resource Collection Action - POST | Create        |
| Resource Actions - POST           | Update        |
| Resource Actions - PUT            | Compile       |

If you're using a different Resource Collection Name and/or Resource Name, you have to modify also the extension settings. See `resourceCollection` and `resourceName` inside the example settings.

## Extension Settings

This extension contributes the following settings:

* `servicemanager.environments` - Object - Defines the available environments


### Example

```
"servicemanager" : {
    "environments" : {
        "env1": {
            "name": "Environment 1",
            "url": "http://localhost:13080/SM/9/rest/",
            "resourceCollection": "ScriptLibrary",
            "resourceName": "ScriptLibrary",
            "username": "System.Admin",
            "password": "System.Admin",
            "path": "/Users/marcusreinhardt/Documents/sm/env1/",
            "defaultPackage" : "User",
            "fields" : {
                "name" : "Name",
                "package" : "Package",
                "script" : "Script"
            }
        },
        "env2": {
            "name": "Environment 2",
            "url": "http://localhost:23080/SM/9/rest/",
            "resourceCollection": "ScriptLibrary",
            "resourceName": "ScriptLibrary",
            "username": "System.Admin",
            "password": "System.Admin",
            "path": "/Users/marcusreinhardt/Documents/sm/env2/",
            "defaultPackage": "User",
            "fields": {
                "name": "Name",
                "package": "Package",
                "script": "Script"
            }
        }
    }
}
```

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

### 1.0.0

Initial release

## Credits

Special thanks goes to:

* [yim OHG](https://www.y-im.de) - My old company :heart: They got me the idea to give VSCode a try and here it is - the SM Extension :)
