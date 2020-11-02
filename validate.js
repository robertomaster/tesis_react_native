import validation from 'validate.js';

export const validate = (fieldName, value, constraints) => {
  let formValues = {};
  formValues[fieldName] = value;

  let formFields = {};
  formFields[fieldName] = constraints[fieldName];

  const result = validation(formValues, formFields);

  if (result) {
    const updatedFieldName = `${fieldName
      .charAt(0)
      .toUpperCase()}${fieldName.slice(1).replace('_', ' ')}`;
    return result[fieldName][0].replace(updatedFieldName, '').trim();
  }
  return null;
};