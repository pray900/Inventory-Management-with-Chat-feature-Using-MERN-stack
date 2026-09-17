import React from 'react';
import PropTypes from 'prop-types';

export const Pagination = ({ page, pages, total, onChange }) => {
    if (pages <= 1) return null;

    return (
        <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-secondary small">{total} total</span>
            <div>
                <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    disabled={page <= 1}
                    onClick={() => onChange(page - 1)}
                >
                    Prev
                </button>
                <span className="text-secondary small">Page {page} of {pages}</span>
                <button
                    className="btn btn-outline-secondary btn-sm ms-2"
                    disabled={page >= pages}
                    onClick={() => onChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    )
}

Pagination.propTypes = {
    page: PropTypes.number.isRequired,
    pages: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
}
