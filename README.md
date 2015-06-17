# cabinet-js-sdk
This library provides access to common Cabinet APIs.
### Usage

```javascript
    var cabinetSDK = require('cabinet-js-sdk');

    var config = {
    	apiUrl: 'http://localhost:8080/api',
		timeout: 60000,
		username: 'username',
		password: 'password'
    }

    cabinetSDK.configure(config);

    return cabinetSDK.getEnrollment('userId', 'courseId')
		.then(function(enrollment) {
			//...
		}, function(err) {
			//...
		});
```
