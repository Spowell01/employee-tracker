const mysql = require('mysql2');
const inquirer = require('inquirer');
require('dotenv').config();

// Create a connection to the MySQL database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: 3306, // Default MySQL port
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  startApp();
});

// Function to start the application and present options to the user
function startApp() {
  inquirer
    .prompt({
      name: 'action',
      type: 'list',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Delete a department',
        'Delete an employee',
        'Delete a role',
        'Exit'
      ]
    })
    .then((answer) => {
      switch (answer.action) {
        case 'View all departments':
          viewAllDepartments();
          break;
        case 'View all roles':
          viewAllRoles();
          break;
        case 'View all employees':
          viewAllEmployees();
          break;
        case 'Add a department':
          addDepartment();
          break;
        case 'Add a role':
          addRole();
          break;
        case 'Add an employee':
          addEmployee();
          break;
        case 'Update an employee role':
          updateEmployeeRole();
          break;
        case 'Delete a Department':
            deleteDepartment();
            break;
        case 'Delete an employee':
            deleteEmployee();
            break;
        case 'Delete a role':
            deleteRole();
            break;
        case 'Exit':
          connection.end();
          break;
          
      }
    });
}

// Function to view all departments
function viewAllDepartments() {
    // Query the database to retrieve all departments
    connection.query('SELECT * FROM department', (err, res) => {
      if (err) {
        console.error('Error retrieving departments:', err);
        return;
      }
      // Display the results using console.table
      console.table(res);
      // Restart the application
      startApp();
    });
  }

// Function to view all roles
function viewAllRoles() {
    // Query the database to retrieve all roles
    connection.query('SELECT * FROM role', (err, res) => {
      if (err) {
        console.error('Error retrieving roles:', err);
        return;
      }
      // Display the results using console.table
      console.table(res);
      // Restart the application
      startApp();
    });
  }

// Function to view all employees
function viewAllEmployees() {
    // Query the database to retrieve all employee data
    const query = `
      SELECT 
        employee.id AS 'Employee ID',
        employee.first_name AS 'First Name',
        employee.last_name AS 'Last Name',
        role.title AS 'Job Title',
        department.name AS 'Department',
        role.salary AS 'Salary',
        CONCAT(manager.first_name, ' ', manager.last_name) AS 'Manager'
      FROM 
        employee
      INNER JOIN 
        role ON employee.role_id = role.id
      INNER JOIN 
        department ON role.department_id = department.id
      LEFT JOIN 
        employee AS manager ON employee.manager_id = manager.id;
    `;
  
    connection.query(query, (err, res) => {
      if (err) {
        console.error('Error retrieving employees:', err);
        return;
      }
      // Display the results using console.table
      console.table(res);
      // Restart the application
      startApp();
    });
  }

// Function to add a department
function addDepartment() {
    // Prompt the user to enter the name of the new department
    inquirer
      .prompt({
        type: 'input',
        message: 'Enter the name of the new department:',
        name: 'departmentName'
      })
      .then((answers) => {
        // Add the department to the database
        const query = 'INSERT INTO department (name) VALUES (?)';
        connection.query(query, answers.departmentName, (err, res) => {
          if (err) {
            console.error('Error adding department:', err);
            return;
          }
          console.log('Department added successfully!');
          // Restart the application
          startApp();
        });
      });
  }

// Function to add a role
function addRole() {
    // Query the database to retrieve the list of departments
    const departmentQuery = 'SELECT id, name FROM department';
    connection.query(departmentQuery, (err, departments) => {
      if (err) {
        console.error('Error retrieving departments:', err);
        return;
      }
      // Prompt the user to enter details for the new role
      inquirer
        .prompt([
          {
            type: 'input',
            message: 'Enter the name of the new role:',
            name: 'roleName'
          },
          {
            type: 'input',
            message: 'Enter the salary for the new role:',
            name: 'salary'
          },
          {
            type: 'list',
            message: 'Select the department for the new role:',
            name: 'department',
            choices: departments.map(department => ({ name: department.name, value: department.id }))
          }
        ])
        .then((answers) => {
          // Add the role to the database
          const query = 'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)';
          connection.query(query, [answers.roleName, answers.salary, answers.department], (err, res) => {
            if (err) {
              console.error('Error adding role:', err);
              return;
            }
            console.log('Role added successfully!');
            // Restart the application
            startApp();
          });
        });
    });
  }

// Function to add an employee
function addEmployee() {
    // Query the database to retrieve the list of roles and employees (for manager selection)
    const roleQuery = 'SELECT id, title FROM role';
    const employeeQuery = 'SELECT id, CONCAT(first_name, " ", last_name) AS manager FROM employee';
    
    connection.query(roleQuery, (err, roles) => {
      if (err) {
        console.error('Error retrieving roles:', err);
        return;
      }
      connection.query(employeeQuery, (err, employees) => {
        if (err) {
          console.error('Error retrieving employees:', err);
          return;
        }
        // Prompt the user to enter details for the new employee
        inquirer
          .prompt([
            {
              type: 'input',
              message: 'Enter the first name of the new employee:',
              name: 'firstName'
            },
            {
              type: 'input',
              message: 'Enter the last name of the new employee:',
              name: 'lastName'
            },
            {
              type: 'list',
              message: 'Select the role for the new employee:',
              name: 'role',
              choices: roles.map(role => ({ name: role.title, value: role.id }))
            },
            {
              type: 'list',
              message: 'Select the manager for the new employee:',
              name: 'manager',
              choices: [{ name: 'None', value: null }, ...employees.map(employee => ({ name: employee.manager, value: employee.id }))]
            }
          ])
          .then((answers) => {
            // Add the employee to the database
            const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)';
            connection.query(query, [answers.firstName, answers.lastName, answers.role, answers.manager], (err, res) => {
              if (err) {
                console.error('Error adding employee:', err);
                return;
              }
              console.log('Employee added successfully!');
              // Restart the application
              startApp();
            });
          });
      });
    });
  }

// Function to update an employee role
function updateEmployeeRole() {
    // Query the database to retrieve the list of employees and roles
    const employeeQuery = 'SELECT id, CONCAT(first_name, " ", last_name) AS employee FROM employee';
    const roleQuery = 'SELECT id, title FROM role';
  
    connection.query(employeeQuery, (err, employees) => {
      if (err) {
        console.error('Error retrieving employees:', err);
        return;
      }
      connection.query(roleQuery, (err, roles) => {
        if (err) {
          console.error('Error retrieving roles:', err);
          return;
        }
        // Prompt the user to select an employee and their new role
        inquirer
          .prompt([
            {
              type: 'list',
              message: 'Select the employee to update:',
              name: 'employee',
              choices: employees.map(employee => ({ name: employee.employee, value: employee.id }))
            },
            {
              type: 'list',
              message: 'Select the new role for the employee:',
              name: 'newRole',
              choices: roles.map(role => ({ name: role.title, value: role.id }))
            }
          ])
          .then((answers) => {
            // Update the employee's role in the database
            const query = 'UPDATE employee SET role_id = ? WHERE id = ?';
            connection.query(query, [answers.newRole, answers.employee], (err, res) => {
              if (err) {
                console.error('Error updating employee role:', err);
                return;
              }
              console.log('Employee role updated successfully!');
              // Restart the application
              startApp();
            });
          });
      });
    });
  }

  function deleteDepartment() {
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'departmentId',
          message: 'Enter the ID of the department you want to delete:',
        },
      ])
      .then((answers) => {
        const departmentId = answers.departmentId;
        const query = 'DELETE FROM departments WHERE id = ?';
  
        connection.query(query, [departmentId], (err, result) => {
          if (err) {
            console.error('Error deleting department:', err);
          } else {
            console.log('Department deleted successfully.');
            // Optionally, you could display updated data after deletion
            viewAllDepartments();
          }
        });
      });
  }

  function deleteEmployee() {
    inquirer
      .prompt({
        type: 'input',
        message: 'Enter the ID of the employee you want to delete:',
        name: 'employeeId'
      })
      .then((answers) => {
        const employeeId = answers.employeeId;
        const query = 'DELETE FROM employee WHERE id = ?';
        
        connection.query(query, [employeeId], (err, result) => {
          if (err) {
            console.error('Error deleting employee:', err);
            return;
          }
          console.log('Employee deleted successfully.');
          // Restart the application
          startApp();
        });
      });
  }

  function deleteRole() {
    inquirer
      .prompt({
        type: 'input',
        message: 'Enter the ID of the role you want to delete:',
        name: 'roleId'
      })
      .then((answers) => {
        const roleId = answers.roleId;
        const query = 'DELETE FROM role WHERE id = ?';
        
        connection.query(query, [roleId], (err, result) => {
          if (err) {
            console.error('Error deleting role:', err);
            return;
          }
          console.log('Role deleted successfully.');
          // Restart the application
          startApp();
        });
      });
  }