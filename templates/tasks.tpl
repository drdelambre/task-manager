<link class="tasks" rel="stylesheet" type="text/css" href="{$url_base}/css/tasks.css" />
<div class="button" id="add-list">create a list</div>
<div id="new-list" class="list-edit" style="display:none;">
	<div class="name-title">name</div>
	<div class="input-wrap name-wrap"><textarea></textarea></div>
	<div class="desc-wrap" style="margin: 0.5em 0pt;">
		<div class="txt-title">description</div>
		<div class="input-wrap"><textarea></textarea></div>
	</div>
	<div class="user-list" style="display:none"></div>
	<div class="invite-action">
		<div class="button notice">invite</div>
		<div class="input-wrap"><input /></div>
	</div>
	<div class="bottom-box">
		<div class="buttons">
			<div class="button notice" style="float: right;">add</div>
			<div class="button" style="float: right;">cancel</div>
		</div>
		<span class="date-select">start date <input class="date-entry" /></span>
		<span class="date-select" style="margin-left:1em;">end date <input class="date-entry" /></span>
	</div>
	<div class="date-box" style="display:none">
		<div class="year"><div class="year-wrap">
		</div></div>
		<div class="month"><div class="month-wrap">
			<span>jan</span>
			<span>feb</span>
			<span>mar</span>
			<span>apr</span>
			<span>may</span>
			<span>jun</span>
			<span>jul</span>
			<span>aug</span>
			<span>sep</span>
			<span>oct</span>
			<span>nov</span>
			<span>dec</span>
		</div></div>
		<div class="day"><div class="day-wrap"></div></div>
	</div>
</div>
<div id="lists">
{foreach from=$current_user->lists item=curr name=lister}
	<div class="list">
		<input type="hidden" value="{$curr->id}">
		<div class="info">
			<div class="buttons"><div class="button notice">delete</div></div>
			<div class="name">
				<div class="remaining"><span>{$curr->active_todos|@count}</span>remain</div>
				{$curr->name}
			</div>
			{if $curr->text}
			<div class="list-text">{$curr->text}</div>
			{/if}
			{if $curr->startdate}
			<div class="times">
			{$curr->startdate|date_preference}
			{if $curr->enddate}
				<span>until</span>
				{$curr->enddate|date_preference}
			{/if}
			</div>
			{/if}
		</div>
		<div class="active" style="display:none;">
		{foreach from=$curr->active_todos item=todo name=loop}
			<div class="entry {if $smarty.foreach.loop.iteration%2}odd{else}even{/if}">
				<input type="hidden" value="{$todo->id}">
				<div class="buttons">
			{if $todo->claimed_by_id}
				{if $todo->claimed_by_id eq $current_user->id}<div class="claim selected">unclaim</div>{else}<div class="claim claimed">claimed</div>{/if}
			{else}
				<div class="claim">claim</div>
			{/if}
					<div class="checkbox"></div>
				</div>
				<div class="body">
					<div class="text-wrap">{$todo->text}</div>
					<div class="comment{if $todo->comments|@count gt 0} avail{/if}">
						<img src="{$url_base}/images/commentA.png">
						<span>{if $todo->comments|@count gt 0}{$todo->comments|@count}{/if}</span>
					</div>
				</div>
				<div class="comment-list" style="display: none">
					<div class="comments"{if $todo->comments|@count le 0} style="display:none;"{/if}>
					{foreach from=$todo->comments(0,5,'desc') item=com name=commentors}
						<div class="comment{if $com->hours} timed{/if}{if $smarty.foreach.commentors.last} last{/if}">
							<input type="hidden" value="{$com->id}" />
							<div class="creator">
								{$com->created_by->name}
								<span class="time"><input type="hidden" value="{$com->created}">{$com->created|relative_time}</span>
							</div>
							{if $com->hours}
								<div class="hours"><span>{$com->hours}</span>hrs</div>
							{/if}
							{$com->text}
							{if $com->files|@count gt 0}
							<div class="files">
								{foreach from=$com->files item=file}
								<a href="{$url_base}/download/{$file.hash}">{$file.name}</a>
								{/foreach}
							</div>
							{/if}
						</div>
					{/foreach}
					</div>
					<div class="new-comment">
						<div class="buttons">
							<div class="button notice">clear</div>
							<div class="button">add</div>
						</div>
						<div class="hours">
							<div class="input-wrap"><input /></div>
							<div class="title">hours</div>
						</div>
						<div class="input-wrap"><textarea></textarea></div>
					</div>
				</div>
			</div>
		{/foreach}
		</div>
		<div class="new-todo" style="display:none;"><div class="new-todo-wrap">
			<div class="buttons">
				<div class="button notice">clear</div>
				<div class="button">add</div>
			</div>
			<div class="input-wrap"><textarea></textarea></div>
		</div></div>
		<div class="inactive" style="display:none;">
		{foreach from=$curr->completed_todos(0,10,"desc") item=todo name=deadTodo}
			<div class="entry done">
				<input type="hidden" value="{$todo->id}">
				<div class="buttons">
			{if $todo->claimed_by_id}
				{if $todo->claimed_by_id eq $current_user->id}<div class="claim selected">unclaim</div>{else}<div class="claim claimed">claimed</div>{/if}
			{else}
					<div class="claim">claim</div>
			{/if}
					<div class="checkbox selected"></div>
				</div>
				<div class="body">
					<div class="text-wrap">
						<div class="completed"><img src="{$url_base}/images/trash.png">{$todo->completed_by->name}<span class="time"><input type="hidden" value="{$todo->completed}">{$todo->completed|relative_time}</span></div>
						{$todo->text}
					{if $todo->comments|@count gt 0}
						<div class="comment">
							<div><img src="{$url_base}/images/commentA.png"></div>
							<span>{$todo->comments|@count}</span>
						</div>
					{/if}
					</div>
				</div>
				<div class="comment-list" style="display: none">
					<div class="comments">
					{foreach from=$todo->comments(0,5,'desc') item=com name=commentoras}
						<div class="comment{if $com->hours} timed{/if}{if $smarty.foreach.commentoras.last} last{/if}">
							<div class="creator">
								{$com->created_by->name}
								<span class="time"><input type="hidden" value="{$com->created}">{$com->created|relative_time}</span>
							</div>
							{if $com->hours}
								<div class="hours"><span>{$com->hours}</span>hrs</div>
							{/if}
							{$com->text}
							{if $com->files|@count gt 0}
							<div class="files">
								{foreach from=$com->files item=file}
								<a href="{$url_base}/download/{$file.hash}">{$file.name}</a>
								{/foreach}
							</div>
							{/if}
						</div>
					{/foreach}
					</div>
				</div>
			</div>
		{/foreach}
		</div>
	</div>
{/foreach}
</div>
