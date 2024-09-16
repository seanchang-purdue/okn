
from collections import OrderedDict

argument_list_html_template = \
"""<form action="/{0}-chart" method="post" class="center">
{1}
<br>
<button type="submit" class="center">Submit</button>
</form>"""

feature_list = open('feature_list.txt', 'r').read().split('\n')

chart_setting = {
    'heatmap': {
        (0, 'start-date'): ('input', 'date'),
        (1, 'end-date'): ('input', 'date'),
    },
    'heatmap-on-map': {
        (0, 'start-date'): ('input', 'date'),
        (1, 'end-date'): ('input', 'date'),
    },
    'time-series':  {
        (0, 'start-date'): ('input', 'date'),
        (1, 'end-date'): ('input', 'date'),
    },
    'demographic': {
        (0, 'feature'): ('option', feature_list),
        (1, 'values'): ('option', ['count']),
        (2, 'start-date'): ('input', 'date'),
        (3, 'end-date'): ('input', 'date'),
    }
}

def build_argument_list(chart_type, **kwargs):
    if chart_type not in chart_setting:
        return 'Invalid chart type'
    arg_info = chart_setting[chart_type]
    arg_names = sorted(arg_info.keys())

    body = '<table class="centered-table">'

    for i, arg_name_w_id in enumerate(arg_names):
        input_type, input_details = arg_info[arg_name_w_id]
        arg_name = arg_name_w_id[1]

        cur_arg_part = ''
        cur_arg_part += '<tr>'
        cur_arg_part += f'<td class="right-td">{arg_name}</td>'
        cur_arg_part += '<td class="left-td">'
        cur_arg_part += '<label for="arg{0}"></label>'.format(i, arg_name)
        if input_type == 'option':
            cur_arg_part += '<select name="arg{0}_name" id="arg{0}_id">'.format(i)
            selected_option = kwargs.get('arg{}'.format(i), 'none')
            if selected_option == 'none':
                cur_arg_part += '<option value="none" selected>--</option>'.format(i)
            else:
                cur_arg_part += '<option value="none">--</option>'.format(i)
            for option in input_details:
                if option == selected_option:
                    cur_arg_part += '<option value="{1}" selected>{1}</option>'.format(i, option)
                else:
                    cur_arg_part += '<option value="{1}">{1}</option>'.format(i, option)
            cur_arg_part += '</select>'
        elif input_type == 'input':
            assert input_details == 'date'
            input_contents = kwargs.get('arg{}'.format(i), 'none')
            if input_contents == 'none':
                cur_arg_part += '<input type="date" id="arg{0}_id" name="arg{0}_name">'.format(i)
            else:
                cur_arg_part += '<input type="date" id="arg{0}_id" name="arg{0}_name" value="{1}">'.format(i, input_contents)
        cur_arg_part += '</td></tr>'
        body += cur_arg_part
    
    body += '</table>'
    
    return argument_list_html_template.format(chart_type, body)
