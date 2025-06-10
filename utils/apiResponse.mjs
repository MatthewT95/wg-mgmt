
// This module defines a class for creating structured API responses.
export class ApiResponse {
  constructor() {
    this.data = null; // Data to be returned in the response
    this.status = 500; // HTTP status code
    this.message = ""; // General message for the response
    this.successMessage = ""; // Success message
    this.errorMessage = ""; // Error message
    this.warningMessage = ""; // Warning message

  }

    // Setters for each property
    setData(data) {
        /* Validates that data is defined and not null.
         Throws a TypeError if data is undefined or null.
         @param {any} data - The data to be included in the response
         @return {ApiResponse} - Returns the instance for method chaining
         */
        if (data === undefined || data === null) {
            throw new TypeError('Data must be defined and not null');
        }
        this.data = data;
        return this;
    }

    // * @param {number} status - The HTTP status code for the response
    setStatus(status) {
        /* Validates that status is a valid HTTP status code (100-599).
         Throws a TypeError if status is not a number, not an integer, or outside the valid range.
         @param {number} status - The HTTP status code for the response
         @return {ApiResponse} - Returns the instance for method chaining
         */
        if (typeof status !== 'number' || !Number.isInteger(status) || status < 100 || status > 599) {
            throw new TypeError('Status must be a valid HTTP status code (100-599)');
        }
        this.status = status;
        return this;
    }

    // * @param {string} message - A general message for the response
    setMessage(message) {
        /* Validates that message is a string.
         Throws a TypeError if message is not a string.
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns the instance for method chaining
         */
        if (typeof message !== 'string') {
            throw new TypeError('Message must be a string');
        }
        this.message = message;
        return this;
    }

    // * @param {string} success - A success message for the response
    setSuccessMessage(success) {
        /* Validates that success is a string.
         Throws a TypeError if success is not a string.
         @param {string} success - A success message for the response
         @return {ApiResponse} - Returns the instance for method chaining
         */
        if (typeof success !== 'string') {
            throw new TypeError('Success message must be a string');
        }
        this.successMessage = success;
        return this;
    }

    // * @param {string} error - An error message for the response
    setErrorMessage(error) {
        /* Validates that error is a string.
         Throws a TypeError if error is not a string.
         @param {string} error - An error message for the response
         @return {ApiResponse} - Returns the instance for method chaining
         */
        if (typeof error !== 'string') {
            throw new TypeError('Error must be a string');
        }
        this.errorMessage = error;
        return this;
    }

    // * @param {string} warning - A warning message for the response
    setWarningMessage(warning) {
        /* Validates that warning is a string.
            Throws a TypeError if warning is not a string.
            @param {string} warning - A warning message for the response
            @return {ApiResponse} - Returns the instance for method chaining
        */
        if (typeof warning !== 'string') {
            throw new TypeError('Warning must be a string');
        }
        this.warningMessage = warning;
        return this;
    }

    // These methods set the status code and return the instance for method chaining
    STATUS_OK() {
        this.status = 200;
        return this;
    }

    STATUS_CREATED() {
        this.status = 201;
        return this;
    }

    STATUS_ACCEPTED() {
        this.status = 202;
        return this;
    }

    STATUS_NO_CONTENT() {
        this.status = 204;
        return this;
    }

    STATUS_BAD_REQUEST() {
        this.status = 400;
        return this;
    }

    STATUS_UNAUTHORIZED() {
        this.status = 401;
        return this;
    }

    STATUS_FORBIDDEN() {
        this.status = 403;
        return this;
    }

    STATUS_NOT_FOUND() {
        this.status = 404;
        return this;
    }

    STATUS_INTERNAL_SERVER_ERROR() {
        this.status = 500;
        return this;
    }

    STATUS_NOT_IMPLEMENTED() {
        this.status = 501;
        return this;
    }

    STATUS_SERVICE_UNAVAILABLE() {
        this.status = 503;
        return this;
    }

    STATUS_GATEWAY_TIMEOUT() {
        this.status = 504;
        return this;
    }

    STATUS_HTTP_VERSION_NOT_SUPPORTED() {
        this.status = 505;
        return this;
    }

    STATUS_NETWORK_AUTHENTICATION_REQUIRED() {
        this.status = 511;
        return this;
    }

    STATUS_PRECONDITION_FAILED() {
        this.status = 412;
        return this;
    }

    STATUS_LENGTH_REQUIRED() {
        this.status = 411;
        return this;
    }

    STATUS_EXPECTATION_FAILED() {
        this.status = 417;
        return this;
    }

    STATUS_UNAVAILABLE_FOR_LEGAL_REASONS() {
        this.status = 451;
        return this;
    }

    // Returns the response object with all properties set
    getContent() {
        /* Constructs the response object with all properties.
         Returns an object containing data, message, success, error, and warning if they are set.
         @return {Object} - The response object
         */
        const responseObj = {};
        if (this.data !== null) responseObj.data = this.data;
        if (this.message !== null) responseObj.message = this.message;
        if (this.successMessage !== null) responseObj.successMessage = this.successMessage;
        if (this.errorMessage !== null) responseObj.errorMessage = this.errorMessage;
        if (this.warningMessage !== null) responseObj.warningMessage = this.warningMessage;
        return responseObj;
    }

    // Returns the HTTP status code
    getStatus() {
        /* Returns the HTTP status code.
         If no status is set, defaults to 500.
         @return {number} - The HTTP status code
         */
        return this.status !== null ? this.status : 500; // Default to 500 if no status is set
    }

    static OK(data = null, message = "OK") {
        /* Static method to create a successful response with status 200.
         @param {any} data - The data to be included in the response
         @param {string} message - A message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 200
         */
        return new ApiResponse()
            .setStatus(200)
            .setData(data)
            .setMessage(message);
    }

    static CREATED(data = null, message = "Created") {
        /* Static method to create a successful response with status 201.
         @param {any} data - The data to be included in the response
         @param {string} message - A message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 201
         */
        return new ApiResponse()
            .setStatus(201)
            .setData(data)
            .setMessage(message);
    }

    static BAD_REQUEST(error = "Bad Request", message = "The request could not be understood by the server due to malformed syntax.") {
        /* Static method to create an error response with status 400.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 400
         */
        return new ApiResponse()
            .setStatus(400)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static UNAUTHORIZED(error = "Unauthorized", message = "Authentication is required and has failed or has not yet been provided.") {
        /* Static method to create an error response with status 401.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 401
         */
        return new ApiResponse()
            .setStatus(401)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static FORBIDDEN(error = "Forbidden", message = "The request was a valid request, but the server is refusing to respond to it.") {
        /* Static method to create an error response with status 403.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 403
         */
        return new ApiResponse()
            .setStatus(403)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static NOT_FOUND(error = "Not Found", message = "The requested resource could not be found but may be available in the future.") {
        /* Static method to create an error response with status 404.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 404
         */
        return new ApiResponse()
            .setStatus(404)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static INTERNAL_SERVER_ERROR(error = "Internal Server Error", message = "An unexpected condition was encountered by the server.") {
        /* Static method to create an error response with status 500.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 500
         */
        return new ApiResponse()
            .setStatus(500)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static NOT_IMPLEMENTED(error = "Not Implemented", message = "The server does not support the functionality required to fulfill the request.") {
        /* Static method to create an error response with status 501.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 501
         */
        return new ApiResponse()
            .setStatus(501)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static SERVICE_UNAVAILABLE(error = "Service Unavailable", message = "The server is currently unable to handle the request due to temporary overloading or maintenance of the server.") {
        /* Static method to create an error response with status 503.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 503
         */
        return new ApiResponse()
            .setStatus(503)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static GATEWAY_TIMEOUT(error = "Gateway Timeout", message = "The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.") {
        /* Static method to create an error response with status 504.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 504
         */
        return new ApiResponse()
            .setStatus(504)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static HTTP_VERSION_NOT_SUPPORTED(error = "HTTP Version Not Supported", message = "The server does not support the HTTP protocol version used in the request.") {
        /* Static method to create an error response with status 505.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 505
         */
        return new ApiResponse()
            .setStatus(505)
            .setErrorMessage(error)
            .setMessage(message);
    }

    static NETWORK_AUTHENTICATION_REQUIRED(error = "Network Authentication Required", message = "The client needs to authenticate to gain network access.") {
        /* Static method to create an error response with status 511.
         @param {string} error - An error message for the response
         @param {string} message - A general message for the response
         @return {ApiResponse} - Returns an instance of ApiResponse with status 511
         */
        return new ApiResponse()
            .setStatus(511)
            .setErrorMessage(error)
            .setMessage(message);
    }

    expressRespond(res) {
        /**
         * Sends the response object to the Express response object.
         * Validates that `res` is an Express response object and ensures the response properties are valid.
         * 
         * - If `this.getContent()` returns an empty object, the response will still be sent with the provided status code.
         * - If `this.getStatus()` returns a non-standard status code (outside the range 100-599), an error will be thrown.
         * 
         * @param {Object} res - The Express response object. It must have `status`, `json`, `send`, and `end` methods.
         * @throws {TypeError} If `res` is not a valid Express response object.
         * @throws {Error} If the HTTP status code is invalid or if the response content is not a valid object.
         * @return {void}
         */
        if (!res || typeof res.status !== 'function' || typeof res.json !== 'function' || typeof res.send !== 'function' || typeof res.end !== 'function') {
            throw new TypeError('Invalid Express response object');
        }

        const status = this.getStatus();
        if (typeof status !== 'number' || !Number.isInteger(status) || status < 100 || status > 599) {
            throw new Error('Invalid HTTP status code');
        }

        const content = this.getContent();
        if (typeof content !== 'object' || content === null) {
            throw new Error('Response content must be a valid object');
        }

        // Send the response with the status code and content
        res.status(status).json(content);
    }
}