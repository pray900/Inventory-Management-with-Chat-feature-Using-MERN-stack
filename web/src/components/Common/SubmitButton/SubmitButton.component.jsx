import React from 'react';
import PropTypes from 'prop-types';

export const SubmitButton = ({ enabledLabel, disabledLabel, isSubmitting, isDisabled }) => {
    return isSubmitting
        ? <button disabled className="btn btn-info" >{disabledLabel || 'Submitting...'}</button>
        : <button disabled={isDisabled} type="submit" className="btn btn-primary" >{enabledLabel || 'Submit'}</button>
}

SubmitButton.propTypes = {
    enabledLabel: PropTypes.string,
    disabledLabel: PropTypes.string,
    isSubmitting: PropTypes.bool,
    isDisabled: PropTypes.bool
}
