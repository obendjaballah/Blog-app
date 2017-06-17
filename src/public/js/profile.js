$('#postForm').submit(function (event) {
	event.preventDefault()
	var typedIn = $('#postInput').val()
	$.post('/profile', {typedIn: typedIn}, function(data, status){
		$('#addAfter').after('<div class="col-xs-12"><div class="panel panel-default"><div class="panel-body"><blockquote><h3>' + data + '</h3><footer><small></small></footer></blockquote><hr/><form id="cmntForm" action="/comment" method="post" class="form-group"><input name="postId" type="hidden"/><textarea id="cmntInput" name="comment" rows="1" placeholder="Comment" class="form-control"></textarea><br/><button type="submit" class="btn btn-info">Comment</button><hr/></form></div></div></div>')
	})
})

// $('#cmntForm').submit(function (event){
// 	event.preventDefault()
// 	var typedIn = $('#cmntInput').val()
// 		console.log('comment form')
// 		console.log(typedIn)
// 	$.post('/comment', {typedIn: typedIn}, (data, status)=> {
// 		$('#cmntBtn').after('<div class="actionBox"><ul class="commentList"><li><div class="commentText"><p class="">'+ data.content +'</p> <span class="date sub-text">on March 5th, 2014</span></div></div>')
// 	})
// })

