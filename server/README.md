# OKN Backend

This is the introduction to the backend of the OKN prototype.

## Depedencies

## How to Start

Clone the project

```bash
git clone <repo_name>
```

Run app.py to start the server

```bash
python3 app.py
```

You're now ready to go!

## Structure

```
flask_version
├── alignment_shooting.csv
├── app.py
├── controllers
│  ├── demographic.py
│  ├── heatmap.py
│  └── line.py
├── models
│  └── model.py
├── server
│  ├── routes.py
│  └── server.py
├── static
│  └── images
├── templates
│  └── index.html
└── utils
   ├── draw.py
   └── utils.py
```

### main (app.py)

The main function is app.py. This function will init our backend server.

### server

This folder stores our definition of the routes (api endpoints) for our frontend to access.

- **routes.py**: define the routes

- **server.py**: function to initiliaze the server

### controllers

This folder holds the definitions or functions of each endpoint.

- **heatmap.py**: to generate heatmap data.

- **demographic.py**: to generate demographic data.

- **line.py**: to generate line chart data.

### models

The folder is for initiaziling the DataModel class (singleton

- **model.py**: definition of the DataModel class.

### utils

The folder is for defining all the utility funcitons.

- **draw.py**: Functions for generating graphs

- **utils.py**: Other utility functions