import { TextField } from './textfield';
// Import other controls as needed

export const nodeConfigs = {
  basicNode: {
    controls: [
      {
        type: 'TextField',
        placeholder: 'Enter name'
      },
      {
        type: 'Dropdown',
        options: ['Option 1', 'Option 2', 'Option 3']
      }
    ]
  }
  // Add more node configurations here
};
