<link class="people" rel="stylesheet" type="text/css" href="{$url_base}/css/people.css" />
<div id="search">
	<div class="title">find someone</div>
	<div class="input-wrap"><input></div>
	<div id="autocomplete" style="display:none;">
		<div class="last"><span>25</span> more</div>
	</div>
</div>
<div id="add-user" class="user"><div class="user-wrap">
	<div class="front">
		<div class="add"><span>+</span></div>
		<div class="header">new contact</div>
	</div>
	<div class="back">
		<div class="header">new contact</div>
		<div class="row">
			<div class="title">name</div>
			<div class="input-wrap"><input></div>
		</div>
		<div class="footer">
			<div class="button">cancel</div>
			<div class="button notice">add</div>
		</div>
	</div>
</div></div>
{foreach from=$current_user->contacts item=curr}
<div class="user{if !$curr->email} floating{/if}"><div class="user-wrap">
	<input type="hidden" value="{$curr->id}">
	<input type="hidden" value="{if $curr->email}user{else}float{/if}">
	<div class="front">
		<img class="avatar" src="{$url_base}/images/avatar/blank.png">
		<div class="header">
			<div class="name">{$curr->name}</div>
		</div>
	</div>
	<div class="back">
		<img class="contact" src="{$url_base}/images/contact.png">
		<div class="header">
			<div class="name">{$curr->name}</div>
		</div>
	{if $curr->email}
		<div class='toggle'>
			<div class="button selected">info</div>
			<div class="button last">history</div>
		</div>
		<div class="lists" style="display:none;">
		{foreach from=$curr->history item=hist}
			<div class="list"><input type="hidden" value="{$hist->id}">{$hist->name}</div>
		{/foreach}
		</div>
	{/if}
		<div class="contact">
			{if $curr->email}
			<div class="info">
				<div class="title">email</div>
				<div class="text">{$curr->email}</div>
			</div>
			{/if}
			{foreach from=$curr->info item=info}
			<div class="info">
				<div class="title">{$info[0]}</div>
				<div class="text">{$info[1]}</div>
			</div>
			{/foreach}
			<div class="add-btn">add</div>
		</div>
		<div class="add-more" style="display:none;">
			<div class="info">
				<div class="title">title</div>
				<div class="input-wrap"><input></div>
			</div>
			<div class="info">
				<div class="title">info</div>
				<div class="input-wrap"><textarea></textarea></div>
			</div>
			<div class="footer">
				<div class="button">cancel</div>
				<div class="button notice">add</div>
			</div>
		</div>
	</div>
</div></div>
{/foreach}
