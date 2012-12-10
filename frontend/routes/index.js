/*
 * GET home page.
 */

exports.index = function(req, res,dbManager) {
	res.render('index', {
		title : 'Marekting Grader Events'
	});
};
